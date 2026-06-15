// CoinGecko scraper — THE FLASH LAYER
//
// Designed for real-time freshness. Cache window = 30 minutes.
// Fetches two things per coin:
//   1. /coins/{id}/news   — latest news articles
//   2. /coins/{id}        — community_data (developer_score, sentiment_votes)
//
// CoinGecko also gives us free price data we attach to the response,
// so the dashboard can show price alongside sentiment with zero extra cost.
//
// Rate limit strategy:
//   Free tier: ~30 calls/min unauthenticated, ~500/min with demo key
//   We use: 2 calls per coin × 3 coins = 6 calls per run → completely safe

import { db } from "@/lib/db/client";
import { rawPosts, scrapeCache } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import type { Ticker } from "@/lib/db/schema";

// ── Constants ─────────────────────────────────────────────────────────────────

const CACHE_DURATION_MS = 30 * 60 * 1000;  // 30 minutes — flash layer
const FETCH_TIMEOUT_MS  = 8_000;
const BASE_URL          = "https://api.coingecko.com/api/v3";

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// ── CoinGecko API types ───────────────────────────────────────────────────────

type CoinGeckoNewsItem = {
  id?: string;
  title: string;
  description: string;
  url: string;
  thumb_2x?: string;
  author?: string;
  updated_at: number;   // unix timestamp
};

type CoinGeckoCoinData = {
  id: string;
  symbol: string;
  name: string;
  market_data: {
    current_price: { usd: number };
    price_change_percentage_24h: number;
    market_cap: { usd: number };
  };
  sentiment_votes_up_percentage: number;    // % of users bullish on CoinGecko
  sentiment_votes_down_percentage: number;
  community_data: {
    reddit_subscribers: number;
    reddit_active_accounts: number;
    reddit_average_posts_48h: number;
    reddit_average_comments_48h: number;
    twitter_followers: number;
  };
  developer_data: {
    stars: number;
    forks: number;
    pull_request_contributors: number;
    commit_count_4_weeks: number;
  };
};

// Export so the analyze route can use it for price display
export type CoinPrice = {
  usd: number;
  change24h: number;
  marketCapUsd: number;
  geckoSentimentUp: number;    // CoinGecko's own community sentiment %
  geckoSentimentDown: number;
  redditSubscribers: number;
  twitterFollowers: number;
};

// ── Fetch helper with timeout + retry ─────────────────────────────────────────

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

// ── Fetch current price + community stats ─────────────────────────────────────
// Exported so /api/analyze can include live price in dashboard response

export async function fetchCoinPrice(coingeckoId: string): Promise<CoinPrice | null> {
  try {
    const data = await geckoFetch<CoinGeckoCoinData>(
      `/coins/${coingeckoId}?localization=false&tickers=false&market_data=true&community_data=true&developer_data=false&sparkline=false`
    );

    return {
      usd:                  data.market_data?.current_price?.usd ?? 0,
      change24h:            data.market_data?.price_change_percentage_24h ?? 0,
      marketCapUsd:         data.market_data?.market_cap?.usd ?? 0,
      geckoSentimentUp:     data.sentiment_votes_up_percentage ?? 50,
      geckoSentimentDown:   data.sentiment_votes_down_percentage ?? 50,
      redditSubscribers:    data.community_data?.reddit_subscribers ?? 0,
      twitterFollowers:     data.community_data?.twitter_followers ?? 0,
    };
  } catch (err) {
    console.warn(`[CoinGecko] fetchCoinPrice failed for ${coingeckoId}:`, err);
    return null;
  }
}

// ── Main scraper ──────────────────────────────────────────────────────────────

export async function scrapeCoinGecko(ticker: Ticker): Promise<number> {
  if (!ticker.coingeckoId) {
    console.log(`[CoinGecko] No coingecko_id for ${ticker.symbol}`);
    return 0;
  }

  // ── Cache check (30 min for flash layer) ─────────────────────────────────
  const existing = await db.query.scrapeCache.findFirst({
    where: and(
      eq(scrapeCache.tickerId, ticker.id),
      eq(scrapeCache.sourceType, "coingecko")
    ),
  });

  if (existing) {
    const age = Date.now() - existing.lastFetchedAt.getTime();
    if (age < CACHE_DURATION_MS && existing.status === "success") {
      console.log(`[CoinGecko] ${ticker.symbol} cache fresh (${Math.round(age / 60000)}m old), skipping`);
      return 0;
    }
  }

  // Mark in_progress (concurrent guard)
  await db
    .insert(scrapeCache)
    .values({ tickerId: ticker.id, sourceType: "coingecko", lastFetchedAt: new Date(), status: "in_progress" })
    .onConflictDoUpdate({
      target: [scrapeCache.tickerId, scrapeCache.sourceType],
      set: { lastFetchedAt: new Date(), status: "in_progress" },
    });

  console.log(`[CoinGecko] Fetching news for ${ticker.symbol}...`);

  try {
    // Fetch news articles
    // CoinGecko /coins/{id}/news returns the 50 most recent articles
    const newsData = await geckoFetch<{ news?: CoinGeckoNewsItem[] }>(
      `/coins/${ticker.coingeckoId}/news?count=50`
    );

    const newsItems = newsData.news ?? [];
    let inserted = 0;

    for (const item of newsItems) {
      // Only articles from the last 5 days (matches our deletion window)
      const pubDate = new Date(item.updated_at * 1000);
      const ageMs = Date.now() - pubDate.getTime();
      if (ageMs > 5 * 24 * 60 * 60 * 1000) continue;

      const content = [item.title, item.description].filter(Boolean).join("\n\n");
      if (content.length < 20) continue;

      try {
        await db
          .insert(rawPosts)
          .values({
            tickerId:   ticker.id,
            sourceType: "coingecko",
            externalId: item.id ?? item.url,
            title:      item.title?.slice(0, 500),
            content:    content.slice(0, 5000),
            author:     item.author ?? "CoinGecko News",
            url:        item.url,
            upvotes:    0,
            postedAt:   pubDate,
          })
          .onConflictDoNothing();

        inserted++;
      } catch {
        // duplicate — skip
      }
    }

    // Update cache — success
    await db
      .insert(scrapeCache)
      .values({
        tickerId:      ticker.id,
        sourceType:    "coingecko",
        lastFetchedAt: new Date(),
        postCount:     inserted,
        status:        "success",
      })
      .onConflictDoUpdate({
        target: [scrapeCache.tickerId, scrapeCache.sourceType],
        set: { lastFetchedAt: new Date(), postCount: inserted, status: "success", errorMessage: null },
      });

    console.log(`[CoinGecko] ${ticker.symbol}: inserted ${inserted} articles`);

    // 2s gap between tickers — be polite to free tier
    await sleep(2000);
    return inserted;

  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error(`[CoinGecko] ${ticker.symbol} failed:`, msg);

    await db
      .insert(scrapeCache)
      .values({ tickerId: ticker.id, sourceType: "coingecko", lastFetchedAt: new Date(), status: "error", errorMessage: msg })
      .onConflictDoUpdate({
        target: [scrapeCache.tickerId, scrapeCache.sourceType],
        set: { status: "error", errorMessage: msg, lastFetchedAt: new Date() },
      });

    return 0;
  }
}