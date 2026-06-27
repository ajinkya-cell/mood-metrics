// GET /api/analyze?symbol=BTC
//
// THE BLEND: 60% Flash (CoinGecko + News) + 40% Historical (Reddit)
//
// Flow:
//   1. Pull pre-computed Reddit score from sentiment_timeseries (instant)
//   2. Analyze any new flash posts (CoinGecko/News) that arrived since last visit
//   3. Blend the two scores with weights
//   4. Return score + timeseries + live price + recent signals
//
// Reddit is NEVER scraped on-demand here — that's the 6h cron's job.
// Flash posts get analyzed inline only if there are unanalyzed ones waiting.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import {
  tickers,
  sentimentTimeseries,
  rawPosts,
  sentimentRecords,
  scrapeCache,
  marketIndicators,
} from "@/lib/db/schema";
import { eq, and, desc, gte, isNull } from "drizzle-orm";
import { scrapeCoinGecko, fetchCoinPrice } from "@/lib/scrapers/coingecko";
import { scrapeNewsRSS } from "@/lib/scrapers/news";
import { scrapeFearGreed } from "@/lib/scrapers/fear-greed";
import { scrapeBinanceFundingRate } from "@/lib/scrapers/binance-funding";
import { scrapeWhaleData } from "@/lib/scrapers/whale-tracker";
import { analyzePendingPosts, normalizeFearGreed, normalizeFundingRate, calculateBlendedScore, BLEND_WEIGHTS } from "@/lib/ai/sentiment";


// ── How long flash data stays fresh before we re-fetch ───────────────────────
const FLASH_CACHE_MS = 30 * 60 * 1000;  // 30 minutes

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol")?.toUpperCase();

  if (!symbol) {
    return NextResponse.json({ error: "symbol is required" }, { status: 400 });
  }

  // ── Find ticker ────────────────────────────────────────────────────────────
  const ticker = await db.query.tickers.findFirst({
    where: eq(tickers.symbol, symbol),
  });

  if (!ticker) {
    return NextResponse.json(
      { error: `Unknown symbol: ${symbol}. Supported: BTC, ETH, SOL` },
      { status: 404 }
    );
  }

  // ── Check flash layer freshness ────────────────────────────────────────────
  // Reddit freshness is NOT checked here — that's the cron's responsibility.
  // We only refresh CoinGecko + News on user request if they're stale.
  const flashCacheEntries = await db.query.scrapeCache.findMany({
    where: eq(scrapeCache.tickerId, ticker.id),
  });

  const flashCutoff = new Date(Date.now() - FLASH_CACHE_MS);

  const isFlashFresh = (source: "coingecko" | "news_rss") => {
    const entry = flashCacheEntries.find((c) => c.sourceType === source);
    return entry && entry.lastFetchedAt > flashCutoff && entry.status === "success";
  };

  // Check if the latest funding rate indicator is fresh
  const latestFundingCheck = await db.query.marketIndicators.findFirst({
    where: and(
      eq(marketIndicators.tickerId, ticker.id),
      eq(marketIndicators.indicatorType, "funding_rate"),
    ),
    orderBy: [desc(marketIndicators.collectedAt)],
  });

  const isFundingFresh = latestFundingCheck &&
    latestFundingCheck.collectedAt > flashCutoff;

  // Check if the latest Fear & Greed indicator is fresh
  const latestFngCheck = await db.query.marketIndicators.findFirst({
    where: and(
      isNull(marketIndicators.tickerId),
      eq(marketIndicators.indicatorType, "fear_greed"),
    ),
    orderBy: [desc(marketIndicators.collectedAt)],
  });

  const isFngFresh = latestFngCheck &&
    latestFngCheck.collectedAt > flashCutoff;

  // Check if the latest whale net flow indicator is fresh
  const latestWhaleCheck = await db.query.marketIndicators.findFirst({
    where: and(
      eq(marketIndicators.tickerId, ticker.id),
      eq(marketIndicators.indicatorType, "whale_net_flow"),
    ),
    orderBy: [desc(marketIndicators.collectedAt)],
  });

  const isWhaleFresh = latestWhaleCheck &&
    latestWhaleCheck.collectedAt > flashCutoff;

  // ── Step 1: Refresh stale flash sources ───────────────────────────────────
  const flashRefreshTasks = [];
  if (!isFlashFresh("coingecko")) flashRefreshTasks.push(scrapeCoinGecko(ticker));
  if (!isFlashFresh("news_rss"))  flashRefreshTasks.push(scrapeNewsRSS(ticker));
  if (!isFundingFresh)            flashRefreshTasks.push(scrapeBinanceFundingRate(ticker));
  if (!isFngFresh)                flashRefreshTasks.push(scrapeFearGreed()); // global, but idempotent
  if (!isWhaleFresh)              flashRefreshTasks.push(scrapeWhaleData(ticker));

  if (flashRefreshTasks.length > 0) {
    console.log(`[Analyze] Refreshing flash data for ${symbol}...`);
    await Promise.allSettled(flashRefreshTasks);
  }

  // ── Step 2: Analyze any unanalyzed flash posts (CoinGecko + News only) ────
  // Check if there are raw posts without sentiment records
  const unanalyzedCount = await db
    .select({ post: rawPosts })
    .from(rawPosts)
    .leftJoin(sentimentRecords, eq(rawPosts.id, sentimentRecords.postId))
    .where(
      and(
        eq(rawPosts.tickerId, ticker.id),
        isNull(sentimentRecords.id),
        // Only analyze flash sources here — reddit is analyzed by cron
        // We use a workaround: analyze all pending, reddit cron handles reddit
      )
    )
    .limit(1);

  if (unanalyzedCount.length > 0) {
    console.log(`[Analyze] Found unanalyzed posts for ${symbol}, running AI...`);
    await analyzePendingPosts(ticker);
  }

  // ── Step 3: Pull historical Reddit score from timeseries ──────────────────
  // This is pre-computed by the 6h cron — instant DB read, no AI needed
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const timeseriesData = await db.query.sentimentTimeseries.findMany({
    where: and(
      eq(sentimentTimeseries.tickerId, ticker.id),
      eq(sentimentTimeseries.interval, "1h"),
      gte(sentimentTimeseries.bucketStart, oneDayAgo)
    ),
    orderBy: [desc(sentimentTimeseries.bucketStart)],
  });

  // Average the last 4 buckets (last 4 hours) for a stable Reddit baseline
  const recentBuckets = timeseriesData.slice(0, 4);
  const historicScore =
    recentBuckets.length > 0
      ? recentBuckets.reduce(
          (sum, b) => sum + parseFloat(b.volumeWeightedScore ?? "0"),
          0
        ) / recentBuckets.length
      : 0;

  // ── Step 3.5: Pull Funding Rate + Fear & Greed ──────────────────────────────

  // Funding rate (latest for this ticker)
  const latestFunding = await db.query.marketIndicators.findFirst({
    where: and(
      eq(marketIndicators.tickerId, ticker.id),
      eq(marketIndicators.indicatorType, "funding_rate"),
    ),
    orderBy: [desc(marketIndicators.collectedAt)],
  });

  const rawFundingRate = latestFunding
    ? parseFloat(latestFunding.value as string)
    : 0;
  const fundingScore = normalizeFundingRate(rawFundingRate);

  // Fear & Greed (global, no ticker)
  const latestFng = await db.query.marketIndicators.findFirst({
    where: and(
      isNull(marketIndicators.tickerId),
      eq(marketIndicators.indicatorType, "fear_greed"),
    ),
    orderBy: [desc(marketIndicators.collectedAt)],
  });

  const rawFng = latestFng ? parseFloat(latestFng.value as string) : 50;
  const fearGreedScore = normalizeFearGreed(rawFng);
  const fngLabel = latestFng?.label ?? "neutral";

  // Whale net flow (latest for this ticker)
  const latestWhale = await db.query.marketIndicators.findFirst({
    where: and(
      eq(marketIndicators.tickerId, ticker.id),
      eq(marketIndicators.indicatorType, "whale_net_flow"),
    ),
    orderBy: [desc(marketIndicators.collectedAt)],
  });

  const rawWhaleFlow = latestWhale
    ? parseFloat(latestWhale.value as string)
    : 0;
  const whaleMetadata = latestWhale
    ? (latestWhale.metadata as any)
    : { score: 0, transactions: [] };
  const whaleScore = whaleMetadata.score ?? 0;
  const whaleLabel = latestWhale?.label ?? "neutral";
  const whaleTransactions = whaleMetadata.transactions ?? [];

  // ── Step 4: Calculate flash score from recent CoinGecko + News posts (last 24 hours) ──────
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

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
        gte(rawPosts.postedAt, twentyFourHoursAgo),
        // Flash layer: coingecko + news only
        // (reddit handled separately in timeseries)
      )
    );

  // Filter to non-reddit for the flash score
  const flashOnly = flashPosts.filter(
    (p) => p.sourceType === "coingecko" || p.sourceType === "news_rss"
  );

  const flashScore =
    flashOnly.length > 0
      ? flashOnly.reduce((sum, p) => sum + parseFloat(p.score ?? "0"), 0) /
        flashOnly.length
      : historicScore; // fall back to historic if no flash posts exist yet

  // ── Step 5: THE BLEND (4-layer) ─────────────────────────────────────────────
  // 40% flash + 30% historic + 15% funding rate + 15% fear & greed

  const blended = calculateBlendedScore({
    flashScore,
    historicScore,
    fundingScore,
    fearGreedScore,
  });

  // ── Step 6: Fetch live price from CoinGecko ───────────────────────────────
  // fetchCoinPrice is a lightweight single call — ~200ms
  const price = ticker.coingeckoId
    ? await fetchCoinPrice(ticker.coingeckoId)
    : null;

  // ── Step 7: Recent signals (latest 10 posts with AI labels) ───────────────
  const recentSignals = await db
    .select({
      title:     rawPosts.title,
      source:    rawPosts.sourceType,
      label:     sentimentRecords.label,
      score:     sentimentRecords.score,
      reasoning: sentimentRecords.reasoning,
      postedAt:  rawPosts.postedAt,
      url:       rawPosts.url,
    })
    .from(rawPosts)
    .innerJoin(sentimentRecords, eq(rawPosts.id, sentimentRecords.postId))
    .where(eq(rawPosts.tickerId, ticker.id))
    .orderBy(desc(rawPosts.postedAt))
    .limit(10);

  // ── Step 8: Summary stats from timeseries ─────────────────────────────────
  const totalPosts    = timeseriesData.reduce((s, b) => s + (b.totalPosts ?? 0), 0);
  const totalBullish  = timeseriesData.reduce((s, b) => s + (b.bullishCount ?? 0), 0);
  const totalBearish  = timeseriesData.reduce((s, b) => s + (b.bearishCount ?? 0), 0);
  const totalNeutral  = timeseriesData.reduce((s, b) => s + (b.neutralCount ?? 0), 0);

  return NextResponse.json({
    ticker: {
      symbol: ticker.symbol,
      name:   ticker.name,
    },

    // Live price data from CoinGecko
    price: price ? {
      usd:                Math.round(price.usd),
      change24hPercent:   Math.round(price.change24h * 100) / 100,
      marketCapUsd:       price.marketCapUsd,
      geckoSentimentUp:   Math.round(price.geckoSentimentUp),
      geckoSentimentDown: Math.round(price.geckoSentimentDown),
      redditSubscribers:  price.redditSubscribers,
    } : null,

    // The blended sentiment score
    sentiment: {
      score: blended.score,
      label: blended.label,

      // Show the components separately so the UI can display them
      flashScore:    blended.components.flash,
      historicScore: blended.components.historic,
      fundingScore:  blended.components.funding,
      fearGreedScore: blended.components.fearGreed,
      flashWeight:   BLEND_WEIGHTS.flash,
      historicWeight: BLEND_WEIGHTS.historic,
      fundingWeight:  BLEND_WEIGHTS.funding,
      fearGreedWeight: BLEND_WEIGHTS.fearGreed,

      // Raw indicator values
      fundingRate: {
        rate:  Math.round(rawFundingRate * 100000) / 100000,
        score: Math.round(fundingScore * 100),
        label: rawFundingRate > 0.0001 ? 'bullish' :
               rawFundingRate < -0.0001 ? 'bearish' : 'neutral',
      },
      fearGreed: {
        value: rawFng,
        score: Math.round(fearGreedScore * 100),
        label: fngLabel,
      },

      // 24h aggregate stats (from reddit timeseries)
      totalPostsAnalyzed: totalPosts,
      bullishPercent: totalPosts > 0 ? Math.round((totalBullish / totalPosts) * 100) : 0,
      bearishPercent: totalPosts > 0 ? Math.round((totalBearish / totalPosts) * 100) : 0,
      neutralPercent: totalPosts > 0 ? Math.round((totalNeutral / totalPosts) * 100) : 0,

      // CoinGecko community vote as a third signal
      geckoVoteUp:   price ? Math.round(price.geckoSentimentUp)   : null,
      geckoVoteDown: price ? Math.round(price.geckoSentimentDown)  : null,

      // Whale Movement Layer metrics
      whaleScore: Math.round(whaleScore * 100),
      whaleNetFlowUsd: rawWhaleFlow,
      whaleLabel: whaleLabel,
      whaleTransactions: whaleTransactions,
    },

    // 24h hourly chart data (from pre-computed timeseries)
    timeseries: timeseriesData.map((b) => ({
      time:  b.bucketStart,
      score: Math.round(parseFloat(b.volumeWeightedScore ?? "0") * 100),
      posts: b.totalPosts,
    })),

    // Latest posts with AI verdicts
    recentSignals,

    meta: {
      blendFormula:  "40% flash + 30% historic + 15% funding + 15% fear_greed",
      flashFresh:    isFlashFresh("coingecko") && isFlashFresh("news_rss"),
      flashPostsUsed: flashOnly.length,
      historicBucketsUsed: recentBuckets.length,
      lastUpdated:   new Date().toISOString(),
    },
  });
}