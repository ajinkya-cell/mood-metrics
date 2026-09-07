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

const CRYPTO_RSS_FEEDS = [
  // Broad crypto news (covers BTC / ETH / SOL)
  "https://cryptopanic.com/news/rss/",
  "https://www.coindesk.com/arc/outboundfeeds/rss/",
  "https://cointelegraph.com/rss",
  "https://decrypt.co/feed",
  "https://www.theblock.co/rss.xml",
  "https://blockworks.co/feed",
  "https://beincrypto.com/feed/",
  "https://cryptobriefing.com/feed/",
  "https://cryptoslate.com/feed/",
  "https://dailyhodl.com/feed/",
  "https://news.bitcoin.com/feed/",
  "https://u.today/rss",
  "https://coingape.com/feed/",
  "https://finance.yahoo.com/news/rssindex",
];

function getGoogleNewsFeedUrl(ticker: Ticker): string {
  const query =
    ticker.symbol.toUpperCase() === "BTC"
      ? "Bitcoin+cryptocurrency"
      : ticker.symbol.toUpperCase() === "ETH"
      ? "Ethereum+cryptocurrency"
      : ticker.symbol.toUpperCase() === "SOL"
      ? "Solana+crypto"
      : `${encodeURIComponent(ticker.name)}+cryptocurrency`;
  return `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;
}

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
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1"
      },
    });

    clearTimeout(timer);

    if (!res.ok) {
      return null;
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // Remove noise elements
    $(
      "script, style, nav, footer, .comments, .advertisement, .sidebar, [class*='ads'], [id*='cookie']"
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
      ".story-content",
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
      $("h1").first().text().trim() ||
      $("meta[property='og:title']").attr("content")?.trim() ||
      "Article";

    if (content.length < 100) {
      return null;
    }

    return { title, content };
  } catch (err) {
    return null;
  }
}

function isAboutCoin(ticker: Ticker, text: string): boolean {
  const lower = text.toLowerCase();
  const sym = ticker.symbol.toUpperCase();

  // Special cases for ticker matching
  if (sym === "SOL") {
    return (
      lower.includes("solana") ||
      lower.includes("$sol") ||
      /\bsol\b/i.test(text) ||
      lower.includes("phantom") ||
      lower.includes("raydium") ||
      lower.includes("pump.fun")
    );
  }

  if (sym === "ETH") {
    return (
      lower.includes("ethereum") ||
      lower.includes("ether") ||
      lower.includes("$eth") ||
      /\beth\b/i.test(text) ||
      lower.includes("vitalik") ||
      lower.includes("erc20") ||
      lower.includes("erc-20")
    );
  }

  if (sym === "BTC") {
    return (
      lower.includes("bitcoin") ||
      lower.includes("satoshi") ||
      lower.includes("$btc") ||
      /\bbtc\b/i.test(text) ||
      lower.includes("sats")
    );
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
  maxArticles?: number;
  lookbackDays?: number;
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
    const googleNewsFeed = getGoogleNewsFeedUrl(ticker);
    const allFeeds = [googleNewsFeed, ...CRYPTO_RSS_FEEDS];

    console.log(`[NewsRSS] Fetching ${allFeeds.length} RSS feeds in parallel for ${ticker.symbol}...`);
    const feedPromises = allFeeds.map(async (feedUrl) => {
      try {
        const feed = await parser.parseURL(feedUrl);
        return feed.items ?? [];
      } catch {
        return [];
      }
    });

    const feedsResults = await Promise.all(feedPromises);
    const relevantArticles: Array<{ url: string; title: string; snippet: string; postedAt: Date }> = [];
    const seenUrls = new Set<string>();
    const lookbackDays = opts?.lookbackDays ?? 14;
    const maxLookbackMs = lookbackDays * 24 * 60 * 60 * 1000;

    for (const items of feedsResults) {
      for (const item of items.slice(0, 100)) {
        const pubDate = item.pubDate ? new Date(item.pubDate) : null;
        if (!pubDate || isNaN(pubDate.getTime())) continue;

        const ageMs = Date.now() - pubDate.getTime();
        if (ageMs > maxLookbackMs) continue;

        const snippet = (item.contentSnippet || item.summary || item.content || "").slice(0, 1000);
        const text = `${item.title ?? ""} ${snippet}`;
        if (!isAboutCoin(ticker, text)) continue;

        const url = item.link;
        if (!url || seenUrls.has(url)) continue;
        seenUrls.add(url);

        relevantArticles.push({
          url,
          title: (item.title ?? "Article").trim(),
          snippet,
          postedAt: pubDate,
        });
      }
    }

    console.log(
      `[NewsRSS] Found ${relevantArticles.length} relevant unique articles for ${ticker.symbol}`
    );

    const maxArticles = opts?.maxArticles ?? 80;
    const articlesToFetch = relevantArticles.slice(0, maxArticles);

    // Fetch full text concurrently in batches of 5
    const batchSize = 5;
    const fetchedResults: Array<{ url: string; title: string; content: string; postedAt: Date }> = [];

    for (let i = 0; i < articlesToFetch.length; i += batchSize) {
      const batch = articlesToFetch.slice(i, i + batchSize);
      
      const batchResults = await Promise.all(
        batch.map(async (article) => {
          const extracted = await extractArticleText(article.url);
          if (extracted && extracted.content.length > 100) {
            return { url: article.url, title: extracted.title, content: extracted.content, postedAt: article.postedAt };
          }
          // Fallback to RSS feed title and snippet if HTML fetch was rate-limited or blocked
          const fallbackContent = [article.title, article.snippet].filter(Boolean).join("\n\n").trim();
          if (fallbackContent.length >= 20) {
            return { url: article.url, title: article.title, content: fallbackContent, postedAt: article.postedAt };
          }
          return null;
        })
      );

      for (const res of batchResults) {
        if (res) fetchedResults.push(res);
      }

      // Small delay between batches
      if (i + batchSize < articlesToFetch.length) {
        await sleep(200);
      }
    }

    // Batch insert into rawPosts
    let inserted = 0;
    const rowsToInsert = fetchedResults.map((item) => ({
      tickerId: ticker.id,
      sourceType: "news_rss" as const,
      externalId: item.url.slice(0, 500),
      title: item.title.slice(0, 500),
      content: item.content,
      author: "Crypto News",
      url: item.url.slice(0, 1000),
      upvotes: 0,
      postedAt: item.postedAt,
    }));

    const insertBatchSize = 50;
    for (let i = 0; i < rowsToInsert.length; i += insertBatchSize) {
      const batch = rowsToInsert.slice(i, i + insertBatchSize);
      try {
        await db.insert(rawPosts).values(batch).onConflictDoNothing();
        inserted += batch.length;
      } catch (insertErr) {
        console.warn(`[NewsRSS] Batch insert warning for ${ticker.symbol}:`, insertErr);
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