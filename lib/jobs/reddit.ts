// THE HISTORICAL LAYER job — shared by POST /api/cron/scrape-reddit and
// scripts/cron-reddit.ts (GitHub Actions, every 6 hours).
//
//   1. Cleans up posts older than 14 days
//   2. Fetches Reddit posts (Arctic Shift) for every active ticker
//   3. Runs AI sentiment analysis on every new post
//   4. Rolls up hourly buckets into sentiment_timeseries

import { db } from "@/lib/db/client";
import { tickers, rawPosts, sentimentRecords } from "@/lib/db/schema";
import { eq, lt } from "drizzle-orm";
import { scrapeReddit } from "@/lib/scrapers/reddit";
import { analyzePendingPosts, rollupTimeseries, recordBlendedSentiment } from "@/lib/ai/sentiment";

export async function runRedditJob() {
  const results: Record<string, unknown> = {};

  // ── Step 1: Cleanup posts older than 14 days ─────────────────────────────
  // Delete sentiment_records first (FK references raw_posts)
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  await db.delete(sentimentRecords).where(lt(sentimentRecords.analyzedAt, fourteenDaysAgo));
  await db.delete(rawPosts).where(lt(rawPosts.scrapedAt, fourteenDaysAgo));

  console.log("[RedditCron] Cleanup done");

  // ── Step 2: Fetch, analyze, rollup — one ticker at a time ────────────────
  const activeTickers = await db.query.tickers.findMany({
    where: eq(tickers.isActive, true),
  });

  for (const ticker of activeTickers) {
    console.log(`\n[RedditCron] === ${ticker.symbol} ===`);

    const scraped = await scrapeReddit(ticker, { lookbackDays: 14, maxPagesPerSub: 8 });
    const analyzed = await analyzePendingPosts(ticker, 100);
    await rollupTimeseries(ticker);
    await recordBlendedSentiment(ticker);

    results[ticker.symbol] = { scraped, analyzed };

    // 3s breathing room between tickers
    await new Promise((r) => setTimeout(r, 3000));
  }

  return results;
}
