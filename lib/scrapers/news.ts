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
const FETCH_TIMEOUT_MS = 8_000;

const CRYPTO_RSS_FEEDS = [
  "https://www.coindesk.com/arc/outboundfeeds/rss/",
  "https://cryptoslate.com/feed/",
  "https://decrypt.co/feed",
  "https://cointelegraph.com/rss",
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
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
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
    let title =
      $("h1").first().text() ||
      $("meta[property='og:title']").attr("content") ||
      "Article";

    if (content.length < 100) {
      console.warn(`[Cheerio] Content too short for ${url}`);
      return null;
    }

    return { title, content };
  } catch (err) {
    console.warn(`[Cheerio] Error extracting ${url}:`, err);
    return null;
  }
}

function isAboutCoin(ticker: Ticker, text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes(ticker.symbol.toLowerCase()) ||
    lower.includes(ticker.name.toLowerCase()) ||
    (!!ticker.coingeckoId && lower.includes(ticker.coingeckoId.toLowerCase()))
  );
}

// ── Main scraper ────────────────────────────────────────────────────────────

export async function scrapeNewsRSS(ticker: Ticker): Promise<number> {
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
    // Parse RSS feeds
    const relevantArticles: Array<{ url: string; title: string; postedAt: Date }> =
      [];

    for (const feedUrl of CRYPTO_RSS_FEEDS) {
      try {
        const feed = await parser.parseURL(feedUrl);

        for (const item of feed.items.slice(0, 20)) {
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
      } catch {
        console.warn(`[NewsRSS] Feed parse failed: ${feedUrl}`);
      }
    }

    console.log(
      `[NewsRSS] Found ${relevantArticles.length} relevant articles for ${ticker.symbol}`
    );

    let inserted = 0;

    // Extract full text from each article
    // Limited to 8 articles per run to avoid timeout (Vercel 30s limit)
    for (const article of relevantArticles.slice(0, 8)) {
      const extracted = await extractArticleText(article.url);
      if (!extracted) continue;

      try {
        await db
          .insert(rawPosts)
          .values({
            tickerId: ticker.id,
            sourceType: "news_rss",
            externalId: article.url,
            title: extracted.title.slice(0, 500),
            content: extracted.content,
            author: "Crypto News",
            url: article.url,
            upvotes: 0,
            postedAt: article.postedAt,
          })
          .onConflictDoNothing();

        inserted++;
      } catch {
        // duplicate
      }

      // Polite delay between article fetches
      await sleep(1200);
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