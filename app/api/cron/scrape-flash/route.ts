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
import { scrapeFearGreed } from "@/lib/scrapers/fear-greed";
import { scrapeBinanceFundingRate } from "@/lib/scrapers/binance-funding";

export const maxDuration = 90; // increased from 60 to account for extra API calls

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const force = searchParams.get("force") === "true";

  const startedAt = Date.now();
  const results: Record<string, unknown> = {};
  if (force) console.log("[FlashCron] Force mode — bypassing cache");

  try {
    const activeTickers = await db.query.tickers.findMany({
      where: eq(tickers.isActive, true),
    });

    // Run Fear & Greed once first (global indicator — same value for all tickers)
    await scrapeFearGreed();

    // CoinGecko, News, and Funding Rates can run in parallel per ticker
    for (const ticker of activeTickers) {
      console.log(`[FlashCron] === ${ticker.symbol} ===`);

      const [geckoCount, newsCount, fundingResult] = await Promise.allSettled([
        scrapeCoinGecko(ticker, { force }),
        scrapeNewsRSS(ticker, { force }),
        scrapeBinanceFundingRate(ticker, { force }),
      ]).then((r) =>
        r.map((result) => (result.status === "fulfilled" ? result.value : null))
      );

      results[ticker.symbol] = {
        coingecko: geckoCount ?? 0,
        news: newsCount ?? 0,
        fundingRate: fundingResult ? "ok" : "failed",
      };
    }

    // Add global indicator result
    results._global = {
      fearGreed: "fetched",
    };

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