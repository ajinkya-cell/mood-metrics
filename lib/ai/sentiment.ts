// AI sentiment analysis engine
// Uses Vercel AI SDK + Nvidia NIM (Llama 3.1 8B) to analyze each post
// NOTE: NIM doesn't support generateObject's structured output, so we use
// generateText and parse JSON manually from the response.

import { generateText, embed } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { db } from "@/lib/db/client";
import { rawPosts, sentimentRecords, sentimentTimeseries } from "@/lib/db/schema";
import { eq, isNull, and, desc, sql } from "drizzle-orm";
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
  const timer = setTimeout(() => controller.abort(), 8000); // 8-second timeout

  try {
    const res = await fetch("https://integrate.api.nvidia.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "nvidia/llama-nemotron-embed-1b-v2",
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
    
    const data: any = await res.json();
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
async function analyzePost(post: RawPost, coinName: string): Promise<SentimentResult> {
  const textToAnalyze = [post.title, post.content]
    .filter(Boolean)
    .join("\n")
    .slice(0, 2000);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000); // 12-second timeout

  try {
    const { text } = await generateText({
      model: nim.chatModel("meta/llama-3.1-8b-instruct"),
      abortSignal: controller.signal,
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
    return parseSentiment(text);
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

function parseSentiment(raw: string): SentimentResult {
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
    return { label: "neutral", score: 0, confidence: 0, reasoning: "Failed to parse AI response" };
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
export async function analyzePendingPosts(ticker: Ticker, limit = 50): Promise<number> {
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
    .limit(limit); // process max 'limit' at a time to control API costs and response times

  if (pending.length === 0) {
    console.log(`[AI] No pending posts for ${ticker.symbol}`);
    return 0;
  }

  console.log(`[AI] Analyzing ${pending.length} posts for ${ticker.symbol}...`);
  let analyzed = 0;

  // Process posts concurrently in batches of 3 to speed up execution while respecting Nvidia limits
  const batchSize = 3;
  for (let i = 0; i < pending.length; i += batchSize) {
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
          console.warn(`[AI] Failed to analyze post ${post.id}:`, error);
          return null;
        }
      })
    );

    // Save batch results to database
    for (const res of batchResults) {
      if (!res) continue;
      try {
        await db.insert(sentimentRecords).values({
          postId: res.post.id,
          tickerId: ticker.id,
          label: res.result.label,
          score: res.result.score.toFixed(3),
          confidence: res.result.confidence.toFixed(3),
          reasoning: res.result.reasoning,
          embedding: res.vector,
        });

        analyzed++;
      } catch (dbError) {
        console.warn(`[AI] Database insertion failed for post ${res.post.id}:`, dbError);
      }
    }

    // Small delay between batches
    if (i + batchSize < pending.length) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  console.log(`[AI] ${ticker.symbol}: analyzed ${analyzed} posts`);
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