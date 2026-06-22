// AI sentiment analysis engine
// Uses Vercel AI SDK + Claude to analyze each post and produce a structured score

import { generateObject } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { rawPosts, sentimentRecords, sentimentTimeseries } from "@/lib/db/schema";
import { eq, isNull, and, gte, lte, sql } from "drizzle-orm";
import type { Ticker, RawPost } from "@/lib/db/schema";

const nim = createOpenAICompatible({
    name: "nim",
    baseURL: "https://integrate.api.nvidia.com/v1",
    headers: {
        Authorization: `Bearer ${process.env.NIM_API_KEY}`,
    },
});

// ── Zod schema for the AI's structured output ──────────────────────────────────
const SentimentSchema = z.object({
  label: z.enum(["bullish", "bearish", "neutral"]),
  score: z
    .number()
    .min(-1)
    .max(1)
    .describe("Sentiment score from -1.0 (extremely bearish) to +1.0 (extremely bullish)"),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe("How confident you are in this analysis, 0 to 1"),
  reasoning: z
    .string()
    .max(300)
    .describe("One sentence explaining the key reason for this sentiment"),
});

// ── Analyze a single post ──────────────────────────────────────────────────────
async function analyzePost(post: RawPost, coinName: string) {
  const textToAnalyze = [post.title, post.content]
    .filter(Boolean)
    .join("\n")
    .slice(0, 2000); // Claude doesn't need more than this per post

  const { object } = await generateObject({
   model: nim.chatModel("meta/llama-3.1-8b-instruct"), 
        schema: SentimentSchema,
    prompt: `You are a crypto market sentiment analyst. Analyze this content about ${coinName} and determine the market sentiment.

Content:
${textToAnalyze}

Rules:
- bullish = positive outlook, price will go up, buy signals
- bearish = negative outlook, price will go down, sell signals  
- neutral = informational, no clear direction, mixed signals
- Score +1.0 = extremely bullish, 0 = neutral, -1.0 = extremely bearish
- Focus on market sentiment, not general news value`,
  });

  return object;
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