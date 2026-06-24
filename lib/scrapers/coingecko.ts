// CoinGecko scraper — THE FLASH LAYER
// Updated to include volume data for the new algorithm

import { db } from "@/lib/db/client";
import { rawPosts, scrapeCache } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import type { Ticker } from "@/lib/db/schema";

const CACHE_DURATION_MS = 30 * 60 * 1000;
const FETCH_TIMEOUT_MS = 8_000;
const BASE_URL = "https://api.coingecko.com/api/v3";

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// ── UPDATED PRICE TYPE ──────────────────────────────────────────────────────
// Added volume24h and volume7dAvg for the new algorithm

export type CoinPrice = {
  usd: number;
  change24h: number;
  marketCapUsd: number;
  volume24h: number;
  volume7dAvg: number;
  geckoSentimentUp: number;
  geckoSentimentDown: number;
  redditSubscribers: number;
  twitterFollowers: number;
};

// ── COINGECKO API TYPES ─────────────────────────────────────────────────────

type CoinGeckoNewsItem = {
  id?: string;
  title: string;
  description: string;
  url: string;
  thumb_2x?: string;
  author?: string;
  updated_at: number;
};

type CoinGeckoCoinData = {
  id: string;
  symbol: string;
  name: string;
  market_data: {
    current_price: { usd: number };
    price_change_percentage_24h: number;
    market_cap: { usd: number };
    total_volume: { usd: number };
    total_volumes: { usd: number[] };
  };
  sentiment_votes_up_percentage: number;
  sentiment_votes_down_percentage: number;
  community_data: {
    reddit_subscribers: number;
    reddit_active_accounts: number;
    reddit_average_posts_48h: number;
    reddit_average_comments_48h: number;
    twitter_followers: number;
  };
};

// ── FETCH HELPER ────────────────────────────────────────────────────────────

async function geckoFetch<T>(path: string, attempt = 1): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (process.env.COINGECKO_API_KEY) {
    headers["x-cg-demo-api-key"] = process.env.COINGECKO_API_KEY;
  }

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers,
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.status === 429) {
      if (attempt > 2) throw new Error("CoinGecko rate limit exceeded");
      const retryAfter = res.headers.get("Retry-After");
      const waitMs = retryAfter ? parseInt(retryAfter) * 1000 : 60_000;
      console.warn(`[CoinGecko] Rate limited — waiting ${waitMs / 1000}s`);
      await sleep(waitMs);
      return geckoFetch(path, attempt + 1);
    }

    if (!res.ok) {
      throw new Error(`CoinGecko ${res.status} on ${path}`);
    }

    return res.json() as Promise<T>;
  } catch (err) {
    clearTimeout(timer);
    const isTimeout = err instanceof Error && err.name === "AbortError";
    if (isTimeout) throw new Error(`CoinGecko timeout on ${path}`);
    throw err;
  }
}

// ── FETCH CURRENT PRICE + VOLUME ────────────────────────────────────────────
// UPDATED: Now returns volume data for the algorithm

export async function fetchCoinPrice(coingeckoId: string): Promise<CoinPrice | null> {
  try {
    const data = await geckoFetch<CoinGeckoCoinData>(
      `/coins/${coingeckoId}?localization=false&tickers=false&market_data=true&community_data=true&developer_data=false&sparkline=false`
    );

    // Extract 7-day volume average (for volume momentum calculation)
    const volume7dArray = data.market_data?.total_volumes?.usd ?? [];
    const volume7dAvg =
      volume7dArray.length > 0
        ? volume7dArray.reduce((a, b) => a + b, 0) / volume7dArray.length
        : 0;

    return {
      usd: data.market_data?.current_price?.usd ?? 0,
      change24h: data.market_data?.price_change_percentage_24h ?? 0,
      marketCapUsd: data.market_data?.market_cap?.usd ?? 0,
      volume24h: data.market_data?.total_volume?.usd ?? 0,
      volume7dAvg: volume7dAvg,
      geckoSentimentUp: data.sentiment_votes_up_percentage ?? 50,
      geckoSentimentDown: data.sentiment_votes_down_percentage ?? 50,
      redditSubscribers: data.community_data?.reddit_subscribers ?? 0,
      twitterFollowers: data.community_data?.twitter_followers ?? 0,
    };
  } catch (err) {
    console.warn(`[CoinGecko] fetchCoinPrice failed for ${coingeckoId}:`, err);
    return null;
  }
}

// ── SCRAPE NEWS ─────────────────────────────────────────────────────────────

export async function scrapeCoinGecko(
  ticker: Ticker,
  opts?: { force?: boolean }
): Promise<number> {
  if (!ticker.coingeckoId) {
    console.log(`[CoinGecko] No coingecko_id for ${ticker.symbol}`);
    return 0;
  }

  if (!opts?.force) {
    const existing = await db.query.scrapeCache.findFirst({
      where: and(
        eq(scrapeCache.tickerId, ticker.id),
        eq(scrapeCache.sourceType, "coingecko")
      ),
    });

    if (existing) {
      const age = Date.now() - existing.lastFetchedAt.getTime();
      if (age < CACHE_DURATION_MS && existing.status === "success") {
        console.log(`[CoinGecko] ${ticker.symbol} cache fresh, skipping`);
        return 0;
      }
    }
  }

  await db
    .insert(scrapeCache)
    .values({
      tickerId: ticker.id,
      sourceType: "coingecko",
      lastFetchedAt: new Date(),
      status: "in_progress",
    })
    .onConflictDoUpdate({
      target: [scrapeCache.tickerId, scrapeCache.sourceType],
      set: { lastFetchedAt: new Date(), status: "in_progress" },
    });

  console.log(`[CoinGecko] Fetching news for ${ticker.symbol}...`);

  try {
    const newsData = await geckoFetch<{ news?: CoinGeckoNewsItem[] }>(
      `/coins/${ticker.coingeckoId}/news?count=50`
    );

    const newsItems = newsData.news ?? [];
    let inserted = 0;

    for (const item of newsItems) {
      const pubDate = new Date(item.updated_at * 1000);
      const ageMs = Date.now() - pubDate.getTime();
      if (ageMs > 5 * 24 * 60 * 60 * 1000) continue;

      const content = [item.title, item.description].filter(Boolean).join("\n\n");
      if (content.length < 20) continue;

      try {
        await db
          .insert(rawPosts)
          .values({
            tickerId: ticker.id,
            sourceType: "coingecko",
            externalId: item.id ?? item.url,
            title: item.title?.slice(0, 500),
            content: content.slice(0, 5000),
            author: item.author ?? "CoinGecko News",
            url: item.url,
            upvotes: 0,
            postedAt: pubDate,
          })
          .onConflictDoNothing();

        inserted++;
      } catch {
        // duplicate
      }
    }

    await db
      .insert(scrapeCache)
      .values({
        tickerId: ticker.id,
        sourceType: "coingecko",
        lastFetchedAt: new Date(),
        postCount: inserted,
        status: "success",
      })
      .onConflictDoUpdate({
        target: [scrapeCache.tickerId, scrapeCache.sourceType],
        set: {
          lastFetchedAt: new Date(),
          postCount: inserted,
          status: "success",
          errorMessage: null,
        },
      });

    console.log(`[CoinGecko] ${ticker.symbol}: inserted ${inserted} articles`);

    await sleep(2000);
    return inserted;
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error(`[CoinGecko] ${ticker.symbol} failed:`, msg);

    await db
      .insert(scrapeCache)
      .values({
        tickerId: ticker.id,
        sourceType: "coingecko",
        lastFetchedAt: new Date(),
        status: "error",
        errorMessage: msg,
      })
      .onConflictDoUpdate({
        target: [scrapeCache.tickerId, scrapeCache.sourceType],
        set: { status: "error", errorMessage: msg, lastFetchedAt: new Date() },
      });

    return 0;
  }
}