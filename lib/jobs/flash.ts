// THE FLASH LAYER job — shared by POST /api/cron/scrape-flash and
// scripts/cron-flash.ts (GitHub Actions, hourly).
//
// Fetches CoinGecko news, RSS news, Binance funding, Fear & Greed and whale
// flows, then runs AI analysis + timeseries rollup per ticker.

import { db } from "@/lib/db/client";
import { tickers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { scrapeCoinGecko } from "@/lib/scrapers/coingecko";
import { scrapeNewsRSS } from "@/lib/scrapers/news";
import { scrapeFearGreed } from "@/lib/scrapers/fear-greed";
import { scrapeBinanceFundingRate } from "@/lib/scrapers/binance-funding";
import { scrapeWhaleData } from "@/lib/scrapers/whale-tracker";
import { analyzePendingPosts, rollupTimeseries, recordBlendedSentiment } from "@/lib/ai/sentiment";

export async function runFlashJob({ force = false }: { force?: boolean } = {}) {
  const results: Record<string, unknown> = {};
  if (force) console.log("[FlashCron] Force mode — bypassing cache");

  const activeTickers = await db.query.tickers.findMany({
    where: eq(tickers.isActive, true),
  });

  // Run Fear & Greed once first (global indicator — same value for all tickers)
  await scrapeFearGreed();

  // CoinGecko, News, and Funding Rates can run in parallel per ticker
  for (const ticker of activeTickers) {
    console.log(`[FlashCron] === ${ticker.symbol} ===`);

    const [geckoCount, newsCount, fundingResult, whaleResult] = await Promise.allSettled([
      scrapeCoinGecko(ticker, { force }),
      scrapeNewsRSS(ticker, { force }),
      scrapeBinanceFundingRate(ticker, { force }),
      scrapeWhaleData(ticker, { force }),
    ]).then((r) =>
      r.map((result) => (result.status === "fulfilled" ? result.value : null))
    );

    console.log(`[FlashCron] Running AI analysis & rollup for ${ticker.symbol}...`);
    const analyzedCount = await analyzePendingPosts(ticker);
    await rollupTimeseries(ticker);

    // Record the computed blended sentiment score for history tracking
    console.log(`[FlashCron] Recording blended sentiment for ${ticker.symbol}...`);
    await recordBlendedSentiment(ticker);

    results[ticker.symbol] = {
      coingecko: geckoCount ?? 0,
      news: newsCount ?? 0,
      fundingRate: fundingResult ? "ok" : "failed",
      whaleNetFlow: whaleResult ? "ok" : "failed",
      analyzed: analyzedCount,
    };
  }

  results._global = { fearGreed: "fetched" };
  return results;
}
