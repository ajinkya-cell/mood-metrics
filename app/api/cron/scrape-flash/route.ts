// POST /api/cron/scrape-flash
// THE FLASH LAYER — runs every 30 minutes
//
// Lightweight, fast. Fetches:
//   - CoinGecko news (official JSON API, milliseconds)
//   - Crypto news RSS via ScrapeGraphAI (articles only)
//
// Does NOT touch Reddit — that's the historical cron's job.
// Does NOT do heavy AI batch analysis — analyze route handles
// new flash posts inline when a user requests a coin.
//
// Why this is safe to run every 30 minutes:
//   - CoinGecko: official API, generous rate limits
//   - RSS: just fetching XML, no auth needed
//   - ScrapeGraphAI: capped at 5 articles per run (not 10)

import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { tickers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { scrapeCoinGecko } from "@/lib/scrapers/coingecko";
import { scrapeNewsRSS } from "@/lib/scrapers/news";

export const maxDuration = 60; // 60s is plenty for lightweight fetches

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();
  const results: Record<string, unknown> = {};

  try {
    const activeTickers = await db.query.tickers.findMany({
      where: eq(tickers.isActive, true),
    });

    // CoinGecko and News can run in parallel per ticker —
    // they are different domains with independent rate limits
    for (const ticker of activeTickers) {
      console.log(`[FlashCron] === ${ticker.symbol} ===`);

      const [geckoCount, newsCount] = await Promise.allSettled([
        scrapeCoinGecko(ticker),
        scrapeNewsRSS(ticker),
      ]).then((r) =>
        r.map((result) => (result.status === "fulfilled" ? result.value : 0))
      );

      results[ticker.symbol] = { coingecko: geckoCount, news: newsCount };
    }

    // Note: we do NOT call analyzePendingPosts() here.
    // Flash posts get analyzed inline in /api/analyze when a user
    // actually requests that coin — no wasted AI tokens on unseen data.

    return NextResponse.json({
      success: true,
      layer: "flash",
      durationMs: Date.now() - startedAt,
      results,
    });
  } catch (error) {
    console.error("[FlashCron] Fatal:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}