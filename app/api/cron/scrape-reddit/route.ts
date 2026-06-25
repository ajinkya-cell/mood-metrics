// POST /api/cron/scrape-reddit
// THE HISTORICAL LAYER — runs every 6 hours
//
// This is the heavyweight job. It:
//   1. Fetches Reddit posts for every active ticker
//   2. Runs AI sentiment analysis on every new post
//   3. Rolls up hourly buckets into sentiment_timeseries
//   4. Cleans up posts older than 5 days
//
// Why 6 hours only: Reddit's public JSON is rate-sensitive.
// Running 4x/day keeps our IP footprint predictable and safe.
// The flash cron handles freshness in between.

import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { tickers, rawPosts, sentimentRecords } from "@/lib/db/schema";
import { eq, lt } from "drizzle-orm";
import { scrapeReddit } from "@/lib/scrapers/reddit";
import { analyzePendingPosts, rollupTimeseries } from "@/lib/ai/sentiment";

export const maxDuration = 300; // 5 min — Vercel Pro max for cron

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();
  const results: Record<string, unknown> = {};

  try {
    // ── Step 1: Cleanup posts older than 90 days ──────────────────────────────
    // Delete sentiment_records first (FK references raw_posts)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    await db.delete(sentimentRecords).where(lt(sentimentRecords.analyzedAt, ninetyDaysAgo));
    await db.delete(rawPosts).where(lt(rawPosts.scrapedAt, ninetyDaysAgo));

    console.log("[RedditCron] Cleanup done");

    // ── Step 2: Fetch, analyze, rollup — one ticker at a time ────────────────
    // Sequential (not parallel) — one ticker at a time protects the Reddit
    // rate limit. Each ticker does 2 requests (hot + new) with a 1.2s gap.
    const activeTickers = await db.query.tickers.findMany({
      where: eq(tickers.isActive, true),
    });

    for (const ticker of activeTickers) {
      console.log(`\n[RedditCron] === ${ticker.symbol} ===`);

      const scraped = await scrapeReddit(ticker);
      const analyzed = await analyzePendingPosts(ticker);
      await rollupTimeseries(ticker);

      results[ticker.symbol] = { scraped, analyzed };

      // 3s breathing room between tickers
      await new Promise((r) => setTimeout(r, 3000));
    }

    return NextResponse.json({
      success: true,
      layer: "historical",
      durationMs: Date.now() - startedAt,
      results,
    });
  } catch (error) {
    console.error("[RedditCron] Fatal:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}