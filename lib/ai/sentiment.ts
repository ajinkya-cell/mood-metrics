// AI sentiment analysis engine
// Uses Vercel AI SDK + Nvidia NIM (SENTIMENT_MODEL below) to analyze each post
// NOTE: NIM doesn't support generateObject's structured output, so we use
// generateText and parse JSON manually from the response.

import { generateText } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { db } from "@/lib/db/client";
import { rawPosts, sentimentRecords, sentimentTimeseries, marketIndicators } from "@/lib/db/schema";
import { eq, isNull, and, desc, sql, inArray, gte } from "drizzle-orm";
import { fetchCoinPrice } from "@/lib/scrapers/coingecko";
import type { Ticker, RawPost } from "@/lib/db/schema";

// ── Normalization helpers for new signal sources ──────────────────────────────

export const BLEND_WEIGHTS = {
  flash:     0.45,
  historic:  0.35,
  funding:   0.15,
  fearGreed: 0.05,
} as const;

/**
 * Normalize Fear & Greed Index (0–100) to -1..+1 scale.
 *   0  (extreme fear)  → -1.0
 *   50 (neutral)        →  0.0
 *   100 (extreme greed) → +1.0
 */
export function normalizeFearGreed(value: number): number {
  return clamp((value - 50) / 50, -1, 1);
}

/**
 * Normalize Binance funding rate decimal to -1..+1 scale.
 *   +0.0010 (+0.10%) → +1.0  (bullish leverage)
 *   -0.0010 (-0.10%) → -1.0  (bearish leverage)
 *    0.0000          →  0.0  (neutral)
 *
 * Rates beyond ±0.1% are capped (extreme readings → contrarian signal).
 */
export function normalizeFundingRate(rate: number): number {
  return clamp(rate / 0.001, -1, 1);
}

type BlendInput = {
  flashScore:     number; // -1..+1 from CoinGecko + News
  historicScore:  number; // -1..+1 from Reddit timeseries
  fundingScore:   number; // -1..+1 normalized funding rate
  fearGreedScore: number; // -1..+1 normalized F&G
};

type BlendOutput = {
  score: number;     // -100..+100 (scaled for response)
  label: 'bullish' | 'bearish' | 'neutral';
  components: {
    flash:     number;
    historic:  number;
    funding:   number;
    fearGreed: number;
  };
};

/**
 * Compute the 4-layer blended sentiment score.
 */
export function calculateBlendedScore(input: BlendInput): BlendOutput {
  const rawScore =
    input.flashScore     * BLEND_WEIGHTS.flash +
    input.historicScore  * BLEND_WEIGHTS.historic +
    input.fundingScore   * BLEND_WEIGHTS.funding +
    input.fearGreedScore * BLEND_WEIGHTS.fearGreed;

  const score = Math.round(clamp(rawScore, -1, 1) * 100);
  const label: BlendOutput['label'] =
    score > 20  ? 'bullish' :
    score < -20 ? 'bearish' : 'neutral';

  return {
    score,
    label,
    components: {
      flash:     Math.round(input.flashScore * 100),
      historic:  Math.round(input.historicScore * 100),
      funding:   Math.round(input.fundingScore * 100),
      fearGreed: Math.round(input.fearGreedScore * 100),
    },
  };
}


// NIM retires models without much notice (llama-3.1-8b and llama-3.3-70b went
// 410 on 2026-08-26; llama-3.2-11b-vision stopped responding in Oct 2026).
// If analysis starts failing, run `npx tsx --env-file=.env scripts/check-ai-health.ts`.
export const SENTIMENT_MODEL = "nvidia/nemotron-3.5-lightning-30b-a3b";
export const EMBEDDING_MODEL = "nvidia/nemotron-3-embed-1b";

// Thrown when the model fails on every post at the start of a run — the
// model is down, not a single bad post. Callers let it fail the cron run.
export class AIModelDownError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIModelDownError";
  }
}

const nim = createOpenAICompatible({
  name: "nim",
  baseURL: "https://integrate.api.nvidia.com/v1",
  headers: {
    Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
  },
});

export async function getEmbedding(text: string, inputType: "passage" | "query" = "passage"): Promise<number[] | null> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) return null;
  
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000); // 15-second timeout

  try {
    const res = await fetch("https://integrate.api.nvidia.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: [text],
        encoding_format: "float",
        input_type: inputType,
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timer);

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[AI] Nvidia Embeddings API error: ${res.status} ${res.statusText}. Response: ${errText}`);
      return null;
    }
    
    const data = (await res.json()) as { data?: { embedding?: number[] }[] };
    const rawVector = data.data?.[0]?.embedding;
    if (Array.isArray(rawVector)) {
      return rawVector.slice(0, 1536);
    }
    return null;
  } catch (err) {
    clearTimeout(timer);
    console.error("[AI] Error getting embedding:", err);
    return null;
  }
}

type SentimentResult = {
  label: "bullish" | "bearish" | "neutral";
  score: number;
  confidence: number;
  reasoning: string;
};

// ── Analyze a single post ──────────────────────────────────────────────────────
async function analyzePost(post: RawPost, coinName: string, retries = 2): Promise<SentimentResult> {
  const textToAnalyze = [post.title, post.content]
    .filter(Boolean)
    .join("\n")
    .slice(0, 2000);

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000); // 25-second timeout

    try {
      const { text } = await generateText({
        model: nim.chatModel(SENTIMENT_MODEL),
        abortSignal: controller.signal,
        maxRetries: 0, // this loop handles retries
        temperature: 0.1,
        maxOutputTokens: 300,
        // Nemotron 3.5 is a reasoning model — with thinking on it burns the
        // token budget and returns null content
        providerOptions: { nim: { chat_template_kwargs: { enable_thinking: false } } },
        prompt: `You are a crypto market sentiment analyst. Analyze this content about ${coinName} and determine the market sentiment.

Content:
${textToAnalyze}

Respond with ONLY valid JSON in this exact format (no markdown, no explanation):
{"label": "bullish", "score": 0.5, "confidence": 0.8, "reasoning": "One sentence explaining why."}

Rules:
- label: "bullish" (positive outlook), "bearish" (negative), "neutral" (no clear direction)
- score: -1.0 (extremely bearish) to +1.0 (extremely bullish), 0 = neutral
- confidence: 0.0 to 1.0
- reasoning: one short sentence explaining your analysis
- Focus on market sentiment, not general news value`,
      });

      clearTimeout(timer);
      const parsed = parseSentiment(text);
      // Don't store a fake "neutral" for garbage output — leave the post
      // unanalyzed so it's retried, and let it count as a failure
      if (!parsed) throw new Error(`Unparseable model response: ${text.slice(0, 120)}`);
      return parsed;
    } catch (err) {
      clearTimeout(timer);
      const isLast = attempt === retries;
      if (isLast) throw err;
      const delay = (attempt + 1) * 1000 + Math.random() * 500;
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  return { label: "neutral", score: 0, confidence: 0, reasoning: "Analysis failed" };
}

// ── Health check — one known post through the chat + embedding models ────────
// Used by scripts/check-ai-health.ts (first step of every GitHub Actions run).
export async function checkAIHealth(): Promise<{ ok: boolean; chat: string; embedding: string }> {
  let chat = "ok";
  let embedding = "ok";
  try {
    const result = await analyzePost(
      { title: "Bitcoin ETF inflows hit a record high", content: "Analysts expect a rally." } as RawPost,
      "Bitcoin",
      0
    );
    if (result.label !== "bullish") chat = `unexpected label "${result.label}" for an obviously bullish post`;
  } catch (err) {
    chat = `${SENTIMENT_MODEL} failed: ${err instanceof Error ? err.message : String(err)}`;
  }
  const vector = await getEmbedding("bitcoin rally", "passage");
  if (!vector || vector.length !== 1536) embedding = `${EMBEDDING_MODEL} returned no 1536-dim vector`;
  return { ok: chat === "ok" && embedding === "ok", chat, embedding };
}

function parseSentiment(raw: string): SentimentResult | null {
  try {
    // Extract JSON object from the response (it might have surrounding text)
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");
    const parsed = JSON.parse(jsonMatch[0]);

    // Map various possible field names the model might use to our schema
    const label = normalizeLabel(
      parsed.label ?? parsed.sentiment ?? parsed.analysis?.sentiment ?? "neutral"
    );
    const score = parseFloat(
      parsed.score ?? parsed.market_sentiment_score ?? parsed.analysis?.score ?? 0
    );
    const confidence = parseFloat(
      parsed.confidence ?? parsed.analysis?.confidence ?? 0.5
    );
    const reasoning =
      parsed.reasoning ??
      parsed.reason ??
      parsed.rationale ??
      parsed.analysis?.reasoning ??
      parsed.analysis?.rationale ??
      "";

    return {
      label,
      score: clamp(score, -1, 1),
      confidence: clamp(confidence, 0, 1),
      reasoning: String(reasoning).slice(0, 300),
    };
  } catch {
    return null;
  }
}

function normalizeLabel(val: unknown): "bullish" | "bearish" | "neutral" {
  const s = String(val).toLowerCase().trim();
  if (s.includes("bull")) return "bullish";
  if (s.includes("bear")) return "bearish";
  return "neutral";
}

function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}

// ── Recency decay function ─────────────────────────────────────────────────────
// Newer posts count more. A post from 12h ago is worth 60% of a fresh post.
// Calculation is relative to a reference date (e.g. the start of the hourly bucket) to preserve historical integrity.
function recencyWeight(postedAt: Date, referenceDate: Date = new Date()): number {
  const hoursOld = (referenceDate.getTime() - postedAt.getTime()) / (1000 * 60 * 60);
  return Math.exp(-Math.max(0, hoursOld) / 12); // half-life of ~12 hours
}

// ── Source credibility weights ─────────────────────────────────────────────────
const SOURCE_WEIGHT = {
  news_rss: 1.0,     // news articles = most credible
  coingecko: 0.9,    // curated news
  reddit: 0.7,       // community posts = noisier
} as const;

// ── Analyze all unanalyzed posts for a ticker ──────────────────────────────────
type AnalyzeOptions = {
  batchSize?: number;
  onProgress?: (analyzed: number, total: number) => void;
};

export async function analyzePendingPosts(
  ticker: Ticker,
  limit = 50,
  options?: AnalyzeOptions
): Promise<number> {
  // Find raw posts that don't have a sentiment record yet
  const pending = await db
    .select({ post: rawPosts })
    .from(rawPosts)
    .leftJoin(sentimentRecords, eq(rawPosts.id, sentimentRecords.postId))
    .where(
      and(
        eq(rawPosts.tickerId, ticker.id),
        isNull(sentimentRecords.id) // no sentiment record = not analyzed yet
      )
    )
    .limit(limit);

  if (pending.length === 0) {
    console.log(`[AI] No pending posts for ${ticker.symbol}`);
    return 0;
  }

  console.log(`[AI] Analyzing ${pending.length} posts for ${ticker.symbol}...`);
  let analyzed = 0;
  let failed = 0;
  const batchSize = options?.batchSize ?? 3;
  // If the first FAIL_FAST_AFTER posts all fail, the model is down — stop
  // instead of burning 25s × retries on every remaining post
  const FAIL_FAST_AFTER = 6;
  let lastError = "";

  for (let i = 0; i < pending.length; i += batchSize) {
    if (analyzed === 0 && failed >= FAIL_FAST_AFTER) {
      throw new AIModelDownError(
        `${SENTIMENT_MODEL}: first ${failed} posts for ${ticker.symbol} all failed. Last error: ${lastError}`
      );
    }

    const batch = pending.slice(i, i + batchSize);

    const batchResults = await Promise.all(
      batch.map(async ({ post }) => {
        try {
          const result = await analyzePost(post, ticker.name);

          // Generate embedding using Nvidia NIM
          const textToAnalyze = [post.title, post.content]
            .filter(Boolean)
            .join("\n")
            .slice(0, 1000);
          
          let vector: number[] | null = null;
          try {
            vector = await getEmbedding(textToAnalyze, "passage");
          } catch (embedError) {
            console.warn(`[AI] Embedding generation failed for post ${post.id}:`, embedError);
          }

          return { post, result, vector };
        } catch (error) {
          failed++;
          lastError = error instanceof Error ? error.message : String(error);
          console.warn(`[AI] Failed to analyze post ${post.id}: ${lastError}`);
          return null;
        }
      })
    );

    // Save batch results to database
    for (const res of batchResults) {
      if (!res) continue;
      try {
        await db
          .insert(sentimentRecords)
          .values({
            postId: res.post.id,
            tickerId: ticker.id,
            label: res.result.label,
            score: res.result.score.toFixed(3),
            confidence: res.result.confidence.toFixed(3),
            reasoning: res.result.reasoning,
            embedding: res.vector,
          })
          .onConflictDoNothing();

        analyzed++;
      } catch (dbError) {
        console.warn(`[AI] Database insertion failed for post ${res.post.id}:`, dbError);
      }
    }

    if (options?.onProgress) {
      options.onProgress(analyzed, pending.length);
    }

    // Small delay between batches
    if (i + batchSize < pending.length) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  if (analyzed === 0 && failed > 0) {
    throw new AIModelDownError(
      `${SENTIMENT_MODEL}: all ${failed} posts for ${ticker.symbol} failed. Last error: ${lastError}`
    );
  }

  console.log(`[AI] ${ticker.symbol}: analyzed ${analyzed} posts (${failed} failed)`);
  return analyzed;
}

// ── Roll up hourly timeseries ──────────────────────────────────────────────────
// Call this after analyzePendingPosts to update the timeseries table
export async function rollupTimeseries(ticker: Ticker): Promise<void> {
  console.log(`[Rollup] Building timeseries for ${ticker.symbol}...`);

  // Fetch current spot price from CoinGecko
  let currentPrice: string | null = null;
  try {
    if (ticker.coingeckoId) {
      const priceData = await fetchCoinPrice(ticker.coingeckoId);
      if (priceData && priceData.usd) {
        currentPrice = priceData.usd.toString();
      }
    }
  } catch (priceErr) {
    console.warn(`[Rollup] Failed to fetch current price for ${ticker.symbol}:`, priceErr);
  }

  // Get all sentiment records with their post metadata for this ticker
  const records = await db
    .select({
      score: sentimentRecords.score,
      label: sentimentRecords.label,
      confidence: sentimentRecords.confidence,
      postedAt: rawPosts.postedAt,
      upvotes: rawPosts.upvotes,
      sourceType: rawPosts.sourceType,
    })
    .from(sentimentRecords)
    .innerJoin(rawPosts, eq(sentimentRecords.postId, rawPosts.id))
    .where(eq(sentimentRecords.tickerId, ticker.id));

  if (records.length === 0) return;

  // Group by hour
  const buckets = new Map<
    string,
    {
      scores: number[];
      weightedScores: number[];
      labels: string[];
      totalUpvotes: number;
    }
  >();

  for (const record of records) {
    // Round down to the start of the hour
    const bucketDate = new Date(record.postedAt);
    bucketDate.setMinutes(0, 0, 0);
    const bucketKey = bucketDate.toISOString();

    if (!buckets.has(bucketKey)) {
      buckets.set(bucketKey, {
        scores: [],
        weightedScores: [],
        labels: [],
        totalUpvotes: 0,
      });
    }

    const bucket = buckets.get(bucketKey)!;
    const score = parseFloat(record.score ?? "0");
    const upvotes = record.upvotes ?? 0;
    const recency = recencyWeight(record.postedAt, bucketDate);
    const sourceW = SOURCE_WEIGHT[record.sourceType as keyof typeof SOURCE_WEIGHT] ?? 0.7;

    bucket.scores.push(score);
    // Weighted score = score × recency × source_credibility × (upvote boost)
    const upvoteBoost = Math.log10(Math.max(upvotes, 1) + 1); // log scale so viral posts don't dominate
    bucket.weightedScores.push(score * recency * sourceW * (1 + upvoteBoost * 0.1));
    bucket.labels.push(record.label);
    bucket.totalUpvotes += upvotes;
  }

  // Insert/update buckets in batch (combines 200+ inserts into a single query to eliminate HTTP roundtrips)
  const valuesToInsert = [];
  for (const [bucketKey, bucket] of buckets) {
    const avgScore =
      bucket.scores.reduce((a, b) => a + b, 0) / bucket.scores.length;
    const avgWeighted =
      bucket.weightedScores.reduce((a, b) => a + b, 0) / bucket.weightedScores.length;

    const bullishCount = bucket.labels.filter((l) => l === "bullish").length;
    const bearishCount = bucket.labels.filter((l) => l === "bearish").length;
    const neutralCount = bucket.labels.filter((l) => l === "neutral").length;

    valuesToInsert.push({
      tickerId: ticker.id,
      sourceType: null, // null = all sources combined
      bucketStart: new Date(bucketKey),
      interval: "1h" as const,
      avgScore: avgScore.toFixed(4),
      totalPosts: bucket.scores.length,
      bullishCount,
      bearishCount,
      neutralCount,
      volumeWeightedScore: avgWeighted.toFixed(4),
      spotPrice: currentPrice,
    });
  }

  if (valuesToInsert.length > 0) {
    // Before batch inserting, explicitly delete any existing entries for these bucket starts.
    // This prevents duplicates caused by PostgreSQL treating NULL values as distinct in unique indexes.
    const datesToDelete = valuesToInsert.map(v => v.bucketStart);
    const deleteBatchSize = 50;
    for (let i = 0; i < datesToDelete.length; i += deleteBatchSize) {
      const batchDates = datesToDelete.slice(i, i + deleteBatchSize);
      await db
        .delete(sentimentTimeseries)
        .where(
          and(
            eq(sentimentTimeseries.tickerId, ticker.id),
            eq(sentimentTimeseries.interval, "1h"),
            isNull(sentimentTimeseries.sourceType),
            inArray(sentimentTimeseries.bucketStart, batchDates)
          )
        );
    }

    // Write in batches of 50 to prevent maximum SQL statement parameter limitations
    const batchSize = 50;
    for (let i = 0; i < valuesToInsert.length; i += batchSize) {
      const batch = valuesToInsert.slice(i, i + batchSize);
      await db
        .insert(sentimentTimeseries)
        .values(batch)
        .onConflictDoUpdate({
          target: [
            sentimentTimeseries.tickerId,
            sentimentTimeseries.bucketStart,
            sentimentTimeseries.interval,
            sentimentTimeseries.sourceType,
          ],
          set: {
            avgScore: sql`EXCLUDED.avg_score`,
            totalPosts: sql`EXCLUDED.total_posts`,
            bullishCount: sql`EXCLUDED.bullish_count`,
            bearishCount: sql`EXCLUDED.bearish_count`,
            neutralCount: sql`EXCLUDED.neutral_count`,
            volumeWeightedScore: sql`EXCLUDED.volume_weighted_score`,
            spotPrice: sql`EXCLUDED.spot_price`,
          },
        });
    }
  }

  console.log(`[Rollup] ${ticker.symbol}: updated ${buckets.size} hourly buckets`);
}

// ── Record Blended Sentiment ──────────────────────────────────────────────────
// Call this during the 30-minute flash cron job to permanently log the blended score
export async function recordBlendedSentiment(ticker: Ticker): Promise<number> {
  console.log(`[BlendedRecord] Recording blended sentiment for ${ticker.symbol}...`);
  
  // 1. Get average historical Reddit score (last 24 hours)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const timeseriesData = await db.query.sentimentTimeseries.findMany({
    where: and(
      eq(sentimentTimeseries.tickerId, ticker.id),
      eq(sentimentTimeseries.interval, "1h"),
      gte(sentimentTimeseries.bucketStart, sevenDaysAgo)
    ),
    orderBy: [desc(sentimentTimeseries.bucketStart)],
  });

  const seenTimes = new Set<string>();
  const uniqueTimeseries = timeseriesData.filter((b) => {
    const timeStr = new Date(b.bucketStart).toISOString();
    if (seenTimes.has(timeStr)) return false;
    seenTimes.add(timeStr);
    return true;
  });

  const recentBuckets = uniqueTimeseries.slice(0, 24);
  const historicScore =
    recentBuckets.length > 0
      ? recentBuckets.reduce(
          (sum, b) => sum + parseFloat(b.volumeWeightedScore ?? "0"),
          0
        ) / recentBuckets.length
      : 0;

  // 2. Get latest Funding Rate
  const latestFunding = await db.query.marketIndicators.findFirst({
    where: and(
      eq(marketIndicators.tickerId, ticker.id),
      eq(marketIndicators.indicatorType, "funding_rate"),
    ),
    orderBy: [desc(marketIndicators.collectedAt)],
  });
  const rawFundingRate = latestFunding ? parseFloat(latestFunding.value as string) : 0;
  const fundingScore = normalizeFundingRate(rawFundingRate);

  // 3. Get latest Fear & Greed
  const latestFng = await db.query.marketIndicators.findFirst({
    where: and(
      isNull(marketIndicators.tickerId),
      eq(marketIndicators.indicatorType, "fear_greed"),
    ),
    orderBy: [desc(marketIndicators.collectedAt)],
  });
  const rawFng = latestFng ? parseFloat(latestFng.value as string) : 50;
  const fearGreedScore = normalizeFearGreed(rawFng);

  // 4. Get latest Flash Score (news/coingecko, last 2 days)
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  const flashPosts = await db
    .select({
      score: sentimentRecords.score,
      sourceType: rawPosts.sourceType,
      postedAt: rawPosts.postedAt,
    })
    .from(sentimentRecords)
    .innerJoin(rawPosts, eq(sentimentRecords.postId, rawPosts.id))
    .where(
      and(
        eq(rawPosts.tickerId, ticker.id),
        gte(rawPosts.postedAt, twoDaysAgo)
      )
    );

  const flashOnly = flashPosts.filter(
    (p) => p.sourceType === "coingecko" || p.sourceType === "news_rss"
  );

  const flashScore =
    flashOnly.length > 0
      ? flashOnly.reduce((sum, p) => sum + parseFloat(p.score ?? "0"), 0) /
        flashOnly.length
      : historicScore;

  // 5. Calculate blended score (returns between -100 and +100)
  const blended = calculateBlendedScore({
    flashScore,
    historicScore,
    fundingScore,
    fearGreedScore,
  });

  // 6. Record to market_indicators table
  await db.insert(marketIndicators).values({
    tickerId: ticker.id,
    indicatorType: "blended_sentiment",
    value: blended.score.toString(),
    label: blended.label,
    collectedAt: new Date(),
  });

  console.log(`[BlendedRecord] ${ticker.symbol}: recorded blended score ${blended.score}`);
  return blended.score;
}