// AI sentiment analysis engine
// Uses Vercel AI SDK + Nvidia NIM (Llama 3.1 8B) to analyze each post
// NOTE: NIM doesn't support generateObject's structured output, so we use
// generateText and parse JSON manually from the response.

import { generateText } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { db } from "@/lib/db/client";
import { rawPosts, sentimentRecords, sentimentTimeseries } from "@/lib/db/schema";
import { eq, isNull, and, gte, lte, sql } from "drizzle-orm";
import type { Ticker, RawPost } from "@/lib/db/schema";

// ── Normalization helpers for new signal sources ──────────────────────────────

export const BLEND_WEIGHTS = {
  flash:     0.40,
  historic:  0.30,
  funding:   0.15,
  fearGreed: 0.15,
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

  const { text } = await generateText({
    model: nim.chatModel("meta/llama-3.1-8b-instruct"),
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

  return parseSentiment(text);
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
function recencyWeight(postedAt: Date): number {
  const hoursOld = (Date.now() - postedAt.getTime()) / (1000 * 60 * 60);
  return Math.exp(-hoursOld / 12); // half-life of ~12 hours
}

// ── Source credibility weights ─────────────────────────────────────────────────
const SOURCE_WEIGHT = {
  news_rss: 1.0,     // news articles = most credible
  coingecko: 0.9,    // curated news
  reddit: 0.7,       // community posts = noisier
} as const;

// ── Analyze all unanalyzed posts for a ticker ──────────────────────────────────
export async function analyzePendingPosts(ticker: Ticker): Promise<number> {
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
    .limit(50); // process max 50 at a time to control API costs

  if (pending.length === 0) {
    console.log(`[AI] No pending posts for ${ticker.symbol}`);
    return 0;
  }

  console.log(`[AI] Analyzing ${pending.length} posts for ${ticker.symbol}...`);
  let analyzed = 0;

  for (const { post } of pending) {
    try {
      const result = await analyzePost(post, ticker.name);

      await db.insert(sentimentRecords).values({
        postId: post.id,
        tickerId: ticker.id,
        label: result.label,
        score: result.score.toFixed(3),
        confidence: result.confidence.toFixed(3),
        reasoning: result.reasoning,
      });

      analyzed++;
    } catch (error) {
      console.warn(`[AI] Failed to analyze post ${post.id}:`, error);
    }

    // Small delay to avoid hitting rate limits
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`[AI] ${ticker.symbol}: analyzed ${analyzed} posts`);
  return analyzed;
}

// ── Roll up hourly timeseries ──────────────────────────────────────────────────
// Call this after analyzePendingPosts to update the timeseries table
export async function rollupTimeseries(ticker: Ticker): Promise<void> {
  console.log(`[Rollup] Building timeseries for ${ticker.symbol}...`);

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
    const recency = recencyWeight(record.postedAt);
    const sourceW = SOURCE_WEIGHT[record.sourceType as keyof typeof SOURCE_WEIGHT] ?? 0.7;

    bucket.scores.push(score);
    // Weighted score = score × recency × source_credibility × (upvote boost)
    const upvoteBoost = Math.log10(Math.max(upvotes, 1) + 1); // log scale so viral posts don't dominate
    bucket.weightedScores.push(score * recency * sourceW * (1 + upvoteBoost * 0.1));
    bucket.labels.push(record.label);
    bucket.totalUpvotes += upvotes;
  }

  // Insert/update each bucket
  for (const [bucketKey, bucket] of buckets) {
    const avgScore =
      bucket.scores.reduce((a, b) => a + b, 0) / bucket.scores.length;
    const avgWeighted =
      bucket.weightedScores.reduce((a, b) => a + b, 0) / bucket.weightedScores.length;

    const bullishCount = bucket.labels.filter((l) => l === "bullish").length;
    const bearishCount = bucket.labels.filter((l) => l === "bearish").length;
    const neutralCount = bucket.labels.filter((l) => l === "neutral").length;

    await db
      .insert(sentimentTimeseries)
      .values({
        tickerId: ticker.id,
        sourceType: null, // null = all sources combined
        bucketStart: new Date(bucketKey),
        interval: "1h",
        avgScore: avgScore.toFixed(4),
        totalPosts: bucket.scores.length,
        bullishCount,
        bearishCount,
        neutralCount,
        volumeWeightedScore: avgWeighted.toFixed(4),
      })
      .onConflictDoUpdate({
        target: [
          sentimentTimeseries.tickerId,
          sentimentTimeseries.bucketStart,
          sentimentTimeseries.interval,
          sentimentTimeseries.sourceType,
        ],
        set: {
          avgScore: avgScore.toFixed(4),
          totalPosts: bucket.scores.length,
          bullishCount,
          bearishCount,
          neutralCount,
          volumeWeightedScore: avgWeighted.toFixed(4),
        },
      });
  }

  console.log(`[Rollup] ${ticker.symbol}: updated ${buckets.size} hourly buckets`);
}