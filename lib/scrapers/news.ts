// Crypto news RSS scraper using Cheerio (free HTML parser)
// No ScrapeGraphAI costs — pure HTML extraction
//
// Cheerio is lightweight and works perfectly on Vercel.
// It's the industry standard for Node.js HTML parsing.

import Parser from "rss-parser";
import * as cheerio from "cheerio";
import { db } from "@/lib/db/client";
import { rawPosts, scrapeCache } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import type { Ticker } from "@/lib/db/schema";

const parser = new Parser();
const CACHE_DURATION_MS = 30 * 60 * 1000;
const FETCH_TIMEOUT_MS = 15_000;

// All feeds verified live as of July 2026.
// solanafloor.com/feed removed — returns 404.
const CRYPTO_RSS_FEEDS = [
  // Broad crypto news (covers BTC / ETH / SOL)
  "https://www.coindesk.com/arc/outboundfeeds/rss/",
  "https://cointelegraph.com/rss",
  "https://decrypt.co/feed",
  "https://www.theblock.co/rss.xml",
  "https://blockworks.co/feed",        // strong SOL coverage
  "https://beincrypto.com/feed/",
  "https://cryptobriefing.com/feed/",
  "https://cryptoslate.com/feed/",
  "https://bitcoinmagazine.com/feed",  // BTC-focused but cross-posts SOL/ETH
];

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// ── Fetch article full text using Cheerio (HTML parsing, no AI) ────────────
async function extractArticleText(url: string): Promise<{
  title: string;
  content: string;
} | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1"
      },
    });

    clearTimeout(timer);

    if (!res.ok) {
      console.warn(`[Cheerio] Failed to fetch ${url}: ${res.status}`);
      return null;
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // Strategy: Extract the largest text block (usually the article body)
    // This is heuristic-based, not AI, so it's not perfect but works for ~80% of articles

    // Remove noise elements
    $(
      "script, style, nav, footer, .comments, .advertisement, .sidebar, [class*='ads']"
    ).remove();

    // Try common article selectors
    let content = "";
    const selectors = [
      "article",
      "main",
      "[role='main']",
      ".post-content",
      ".article-body",
      ".entry-content",
      ".content",
    ];

    for (const selector of selectors) {
      const el = $(selector).first();
      if (el.length > 0) {
        content = el.text();
        if (content.length > 500) break; // found substantial content
      }
    }

    // If no article container found, use body text
    if (content.length < 200) {
      content = $("body").text();
    }

    // Clean up whitespace
    content = content
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join("\n")
      .slice(0, 8000);

    // Extract title
    const title =
      $("h1").first().text() ||
      $("meta[property='og:title']").attr("content") ||
      "Article";

    if (content.length < 100) {
      console.warn(`[Cheerio] Content too short for ${url}`);
      return null;
    }

    return { title, content };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      console.warn(`[Cheerio] Timeout extracting ${url} (${FETCH_TIMEOUT_MS}ms)`);
    } else {
      console.warn(`[Cheerio] Error extracting ${url}: ${err instanceof Error ? err.message : String(err)}`);
    }
    return null;
  }
}

function isAboutCoin(ticker: Ticker, text: string): boolean {
  const lower = text.toLowerCase();

  // Special case: "sol" is too common a word (solution, resolve, solar...).
  // For Solana we require the full name or the cashtag $SOL.
  if (ticker.symbol.toUpperCase() === "SOL") {
    return lower.includes("solana") || lower.includes("$sol");
  }

  return (
    lower.includes(ticker.symbol.toLowerCase()) ||
    lower.includes(ticker.name.toLowerCase()) ||
    (!!ticker.coingeckoId && lower.includes(ticker.coingeckoId.toLowerCase()))
  );
}

// ── Main scraper ────────────────────────────────────────────────────────────

type ScrapeOptions = {
  force?: boolean;
};

export async function scrapeNewsRSS(ticker: Ticker, opts?: ScrapeOptions): Promise<number> {
  if (!opts?.force) {
    const existing = await db.query.scrapeCache.findFirst({
      where: and(
        eq(scrapeCache.tickerId, ticker.id),
        eq(scrapeCache.sourceType, "news_rss")
      ),
    });

    if (existing) {
      const age = Date.now() - existing.lastFetchedAt.getTime();
      if (age < CACHE_DURATION_MS && existing.status === "success") {
        console.log(`[NewsRSS] ${ticker.symbol} cache fresh, skipping`);
        return 0;
      }
    }
  }

  // Mark in_progress
  await db
    .insert(scrapeCache)
    .values({
      tickerId: ticker.id,
      sourceType: "news_rss",
      lastFetchedAt: new Date(),
      status: "in_progress",
    })
    .onConflictDoUpdate({
      target: [scrapeCache.tickerId, scrapeCache.sourceType],
      set: { lastFetchedAt: new Date(), status: "in_progress" },
    });

  console.log(`[NewsRSS] Fetching articles for ${ticker.symbol}...`);

  try {
    // Parse RSS feeds in parallel to eliminate sequential request delays
    console.log(`[NewsRSS] Fetching RSS feeds in parallel for ${ticker.symbol}...`);
    const feedPromises = CRYPTO_RSS_FEEDS.map(async (feedUrl) => {
      try {
        const feed = await parser.parseURL(feedUrl);
        return feed.items;
      } catch {
        console.warn(`[NewsRSS] Feed parse failed: ${feedUrl}`);
        return [];
      }
    });

    const feedsResults = await Promise.all(feedPromises);
    const relevantArticles: Array<{ url: string; title: string; postedAt: Date }> = [];

    for (const items of feedsResults) {
      for (const item of items.slice(0, 30)) {
        const pubDate = item.pubDate ? new Date(item.pubDate) : null;
        if (!pubDate) continue;

        const ageMs = Date.now() - pubDate.getTime();
        if (ageMs > 5 * 24 * 60 * 60 * 1000) continue;

        const text = `${item.title ?? ""} ${item.contentSnippet ?? ""}`;
        if (!isAboutCoin(ticker, text)) continue;

        const url = item.link;
        if (!url) continue;

        relevantArticles.push({
          url,
          title: item.title ?? "Article",
          postedAt: pubDate,
        });
      }
    }

    console.log(
      `[NewsRSS] Found ${relevantArticles.length} relevant articles for ${ticker.symbol}`
    );

    let inserted = 0;
    const articlesToFetch = relevantArticles.slice(0, 15);

    // Fetch full text concurrently in batches of 5 to remain polite but extremely fast (takes <4s instead of 30s+)
    const batchSize = 5;
    for (let i = 0; i < articlesToFetch.length; i += batchSize) {
      const batch = articlesToFetch.slice(i, i + batchSize);
      
      const batchResults = await Promise.all(
        batch.map(async (article) => {
          const extracted = await extractArticleText(article.url);
          if (!extracted) return null;
          return { article, extracted };
        })
      );

      for (const res of batchResults) {
        if (!res) continue;
        try {
          await db
            .insert(rawPosts)
            .values({
              tickerId: ticker.id,
              sourceType: "news_rss",
              externalId: res.article.url,
              title: res.extracted.title.slice(0, 500),
              content: res.extracted.content,
              author: "Crypto News",
              url: res.article.url,
              upvotes: 0,
              postedAt: res.article.postedAt,
            })
            .onConflictDoNothing();

          inserted++;
        } catch {
          // duplicate
        }
      }

      // Small delay between batches
      if (i + batchSize < articlesToFetch.length) {
        await sleep(300);
      }
    }

    await db
      .insert(scrapeCache)
      .values({
        tickerId: ticker.id,
        sourceType: "news_rss",
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

    console.log(`[NewsRSS] ${ticker.symbol}: inserted ${inserted} articles`);
    return inserted;
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error(`[NewsRSS] ${ticker.symbol} failed:`, msg);

    await db
      .insert(scrapeCache)
      .values({
        tickerId: ticker.id,
        sourceType: "news_rss",
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