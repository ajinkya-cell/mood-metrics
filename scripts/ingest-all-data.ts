#!/usr/bin/env tsx
/**
 * Master Data Ingestion & Backfill Script
 * 
 * Usage:
 *   npx tsx --env-file=.env scripts/ingest-all-data.ts [options]
 * 
 * Options:
 *   --days=14            Historical lookback window in days (default: 14)
 *   --tickers=BTC,ETH,SOL Comma-separated list of symbols (default: all active)
 *   --skip-ai            Skip AI sentiment analysis and only scrape raw data
 *   --skip-news          Skip flash news RSS / Google News scraping
 *   --skip-reddit        Skip Arctic Shift Reddit scraping
 *   --analyze-limit=500  Max posts to analyze per ticker (default: 500)
 *   --batch-size=3       AI batch concurrency size (default: 3)
 */

import { db } from "@/lib/db/client";
import { tickers, rawPosts, sentimentRecords, sentimentTimeseries, marketIndicators } from "@/lib/db/schema";
import { eq, count, isNull, and } from "drizzle-orm";
import { scrapeNewsRSS } from "@/lib/scrapers/news";
import { scrapeReddit } from "@/lib/scrapers/reddit";
import { scrapeFearGreed } from "@/lib/scrapers/fear-greed";
import { scrapeBinanceFundingRate } from "@/lib/scrapers/binance-funding";
import { scrapeWhaleData } from "@/lib/scrapers/whale-tracker";
import { analyzePendingPosts, rollupTimeseries, recordBlendedSentiment } from "@/lib/ai/sentiment";

// ── Parse CLI flags ─────────────────────────────────────────────────────────
const args = process.argv.slice(2);
function getArg(name: string, defaultValue: string): string {
  const match = args.find((a) => a.startsWith(`--${name}=`));
  return match ? match.split("=")[1] : defaultValue;
}
function hasFlag(name: string): boolean {
  return args.includes(`--${name}`);
}

const LOOKBACK_DAYS = parseInt(getArg("days", "14"), 10);
const TICKERS_FILTER = getArg("tickers", "").toUpperCase();
const SKIP_AI = hasFlag("skip-ai");
const SKIP_NEWS = hasFlag("skip-news");
const SKIP_REDDIT = hasFlag("skip-reddit");
const ANALYZE_LIMIT = parseInt(getArg("analyze-limit", "500"), 10);
const BATCH_SIZE = parseInt(getArg("batch-size", "3"), 10);

async function printDbStats(label: string) {
  const [totalPosts] = await db.select({ val: count() }).from(rawPosts);
  const [totalSentiments] = await db.select({ val: count() }).from(sentimentRecords);
  const [totalTimeseries] = await db.select({ val: count() }).from(sentimentTimeseries);
  const [totalIndicators] = await db.select({ val: count() }).from(marketIndicators);

  console.log(`\n======================================================`);
  console.log(` 📊 DATABASE TELEMETRY [${label}]`);
  console.log(`======================================================`);
  console.log(` • Raw Ingested Posts:       ${totalPosts.val}`);
  console.log(` • AI Sentiment Records:     ${totalSentiments.val}`);
  console.log(` • Hourly Timeseries Points: ${totalTimeseries.val}`);
  console.log(` • Market Indicators Logged: ${totalIndicators.val}`);
  console.log(`======================================================\n`);
}

async function main() {
  console.log("🚀 Starting Crypto-Mood Master Ingestion Pipeline...");
  console.log(`⚙️  Configuration:`);
  console.log(`   - Lookback Days:     ${LOOKBACK_DAYS} days`);
  console.log(`   - Skip News:         ${SKIP_NEWS}`);
  console.log(`   - Skip Reddit:       ${SKIP_REDDIT}`);
  console.log(`   - Skip AI Analysis:  ${SKIP_AI}`);
  console.log(`   - AI Analyze Limit:  ${ANALYZE_LIMIT} per coin`);
  console.log(`   - AI Batch Size:     ${BATCH_SIZE}`);

  await printDbStats("BEFORE RUN");

  // 1. Fetch active tickers
  let activeTickers = await db.query.tickers.findMany({
    where: eq(tickers.isActive, true),
  });

  if (TICKERS_FILTER) {
    const symbols = TICKERS_FILTER.split(",").map((s) => s.trim());
    activeTickers = activeTickers.filter((t) => symbols.includes(t.symbol.toUpperCase()));
  }

  if (activeTickers.length === 0) {
    console.error("❌ No active tickers matched the criteria.");
    process.exit(1);
  }

  console.log(`🎯 Target Tickers: ${activeTickers.map((t) => t.symbol).join(", ")}`);

  // 2. Global market indicators (Fear & Greed)
  try {
    console.log("\n[1/5] 🌐 Scraping Global Fear & Greed Index...");
    await scrapeFearGreed();
  } catch (err: any) {
    console.warn("⚠️ Fear & Greed scrape warning:", err.message);
  }

  // 3. Ingestion per ticker
  for (const ticker of activeTickers) {
    console.log(`\n======================================================`);
    console.log(`🔷 PROCESSING ASSET: ${ticker.name} (${ticker.symbol})`);
    console.log(`======================================================`);

    // A. Funding Rates
    try {
      console.log(`\n[2/5] 📈 Fetching Binance Perpetual Funding Rate for ${ticker.symbol}...`);
      await scrapeBinanceFundingRate(ticker);
    } catch (err: any) {
      console.warn(`⚠️ Funding rate error for ${ticker.symbol}:`, err.message);
    }

    // B. Whale Net Flows
    try {
      console.log(`[2.5/5] 🐋 Ingesting Whale Movement Telemetry for ${ticker.symbol}...`);
      await scrapeWhaleData(ticker);
    } catch (err: any) {
      console.warn(`⚠️ Whale tracker error for ${ticker.symbol}:`, err.message);
    }

    // C. Flash News & Google News RSS
    if (!SKIP_NEWS) {
      console.log(`\n[3/5] 📰 Scraping Flash News & Google News RSS (${LOOKBACK_DAYS}d lookback)...`);
      try {
        const newsInserted = await scrapeNewsRSS(ticker, {
          force: true,
          lookbackDays: LOOKBACK_DAYS,
          maxArticles: 100,
        });
        console.log(`✅ Flash News Ingested: ${newsInserted} new articles for ${ticker.symbol}`);
      } catch (err: any) {
        console.error(`❌ Flash news failed for ${ticker.symbol}:`, err.message);
      }
    }

    // D. Reddit Ingestion
    if (!SKIP_REDDIT) {
      console.log(`\n[4/5] 🤖 Scraping Arctic Shift Reddit Archive (${LOOKBACK_DAYS}d lookback)...`);
      try {
        const redditInserted = await scrapeReddit(ticker, {
          force: true,
          lookbackDays: LOOKBACK_DAYS,
          maxPagesPerSub: 10,
        });
        console.log(`✅ Reddit Ingested: ${redditInserted} new posts for ${ticker.symbol}`);
      } catch (err: any) {
        console.error(`❌ Reddit scrape failed for ${ticker.symbol}:`, err.message);
      }
    }

    // E. AI Sentiment Analysis & Embeddings
    if (!SKIP_AI) {
      console.log(`\n[5/5] 🧠 Running AI Sentiment Analysis & pgvector Embeddings...`);
      try {
        const analyzedCount = await analyzePendingPosts(ticker, ANALYZE_LIMIT, {
          batchSize: BATCH_SIZE,
          onProgress: (done, total) => {
            process.stdout.write(`\r   └─ Progress: ${done}/${total} posts analyzed...`);
          },
        });
        console.log(`\n✅ AI Analysis Complete: ${analyzedCount} posts analyzed for ${ticker.symbol}`);
      } catch (err: any) {
        console.error(`❌ AI Analysis failed for ${ticker.symbol}:`, err.message);
      }

      // F. Timeseries Rollup
      console.log(`\n📊 Recomputing Hourly Timeseries Rollups for ${ticker.symbol}...`);
      try {
        await rollupTimeseries(ticker);
        console.log(`✅ Timeseries rollups successfully updated for ${ticker.symbol}`);
      } catch (err: any) {
        console.error(`❌ Timeseries rollup failed for ${ticker.symbol}:`, err.message);
      }

      // G. Record Blended Sentiment History
      console.log(`🎯 Computing & Logging Blended Sentiment Indicator for ${ticker.symbol}...`);
      try {
        const score = await recordBlendedSentiment(ticker);
        console.log(`✅ Blended Sentiment Score Recorded: ${score > 0 ? "+" : ""}${score}`);
      } catch (err: any) {
        console.error(`❌ Blended sentiment recording failed for ${ticker.symbol}:`, err.message);
      }
    }
  }

  await printDbStats("AFTER RUN");
  console.log("✨ Master data ingestion pipeline completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("💥 Fatal pipeline error:", err);
    process.exit(1);
  });
