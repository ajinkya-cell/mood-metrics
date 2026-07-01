import { db } from "../lib/db/client";
import {
  tickers,
  sentimentTimeseries,
  rawPosts,
  sentimentRecords,
  scrapeCache,
  marketIndicators,
} from "../lib/db/schema";
import { eq, and, desc, gte, isNull } from "drizzle-orm";
import { scrapeCoinGecko, fetchCoinPrice } from "../lib/scrapers/coingecko";
import { scrapeNewsRSS } from "../lib/scrapers/news";
import { scrapeFearGreed } from "../lib/scrapers/fear-greed";
import { scrapeBinanceFundingRate } from "../lib/scrapers/binance-funding";
import { scrapeWhaleData } from "../lib/scrapers/whale-tracker";
import {
  analyzePendingPosts,
  normalizeFearGreed,
  normalizeFundingRate,
  calculateBlendedScore,
  BLEND_WEIGHTS,
} from "../lib/ai/sentiment";

const FLASH_CACHE_MS = 30 * 60 * 1000;  // 30 minutes

async function simulate(symbol: string) {
  console.log(`=== SIMULATING /api/analyze?symbol=${symbol} ===`);
  const ticker = await db.query.tickers.findFirst({
    where: eq(tickers.symbol, symbol),
  });

  if (!ticker) {
    console.error(`Unknown symbol: ${symbol}`);
    return;
  }

  // Check flash cache entries
  const flashCacheEntries = await db.query.scrapeCache.findMany({
    where: eq(scrapeCache.tickerId, ticker.id),
  });

  const flashCutoff = new Date(Date.now() - FLASH_CACHE_MS);
  const isFlashFresh = (source: "coingecko" | "news_rss") => {
    const entry = flashCacheEntries.find((c) => c.sourceType === source);
    return entry && entry.lastFetchedAt > flashCutoff && entry.status === "success";
  };

  console.log("Flash fresh coingecko:", isFlashFresh("coingecko"));
  console.log("Flash fresh news_rss:", isFlashFresh("news_rss"));

  // Check timeseries data
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const timeseriesData = await db.query.sentimentTimeseries.findMany({
    where: and(
      eq(sentimentTimeseries.tickerId, ticker.id),
      eq(sentimentTimeseries.interval, "1h"),
      gte(sentimentTimeseries.bucketStart, sevenDaysAgo)
    ),
    orderBy: [desc(sentimentTimeseries.bucketStart)],
  });

  console.log(`Timeseries buckets found: ${timeseriesData.length}`);

  const recentBuckets = timeseriesData.slice(0, 24);
  const historicScore =
    recentBuckets.length > 0
      ? recentBuckets.reduce(
          (sum, b) => sum + parseFloat(b.volumeWeightedScore ?? "0"),
          0
        ) / recentBuckets.length
      : 0;

  console.log("Historic Score:", historicScore);

  // Funding rate
  const latestFunding = await db.query.marketIndicators.findFirst({
    where: and(
      eq(marketIndicators.tickerId, ticker.id),
      eq(marketIndicators.indicatorType, "funding_rate"),
    ),
    orderBy: [desc(marketIndicators.collectedAt)],
  });
  const rawFundingRate = latestFunding ? parseFloat(latestFunding.value as string) : 0;
  const fundingScore = normalizeFundingRate(rawFundingRate);
  console.log("Funding Score:", fundingScore);

  // Fear & Greed
  const latestFng = await db.query.marketIndicators.findFirst({
    where: and(
      isNull(marketIndicators.tickerId),
      eq(marketIndicators.indicatorType, "fear_greed"),
    ),
    orderBy: [desc(marketIndicators.collectedAt)],
  });
  const rawFng = latestFng ? parseFloat(latestFng.value as string) : 50;
  const fearGreedScore = normalizeFearGreed(rawFng);
  console.log("Fear Greed Score:", fearGreedScore);

  // Flash posts
  const sevenDaysAgoFlash = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const flashPosts = await db
    .select({
      score:      sentimentRecords.score,
      label:      sentimentRecords.label,
      sourceType: rawPosts.sourceType,
      postedAt:   rawPosts.postedAt,
    })
    .from(sentimentRecords)
    .innerJoin(rawPosts, eq(sentimentRecords.postId, rawPosts.id))
    .where(
      and(
        eq(rawPosts.tickerId, ticker.id),
        gte(rawPosts.postedAt, sevenDaysAgoFlash),
      )
    );

  const flashOnly = flashPosts.filter(
    (p) => p.sourceType === "coingecko" || p.sourceType === "news_rss"
  );
  console.log(`Flash posts found: ${flashOnly.length}`);

  const flashScore =
    flashOnly.length > 0
      ? flashOnly.reduce((sum, p) => sum + parseFloat(p.score ?? "0"), 0) /
        flashOnly.length
      : historicScore;

  console.log("Flash Score calculated:", flashScore);

  const blended = calculateBlendedScore({
    flashScore,
    historicScore,
    fundingScore,
    fearGreedScore,
  });

  console.log("Blended Score output:", blended);
}

async function run() {
  for (const sym of ["BTC", "ETH", "SOL"]) {
    try {
      await simulate(sym);
    } catch (e) {
      console.error(`Error simulating ${sym}:`, e);
    }
  }
}

run().then(() => process.exit(0));
