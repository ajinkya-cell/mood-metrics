// Crypto news RSS scraper using ScrapeGraphAI
// Flow: parse RSS feed → get article URLs → ScrapeGraphAI extracts full text + initial sentiment

import Parser from "rss-parser";
import { db } from "@/lib/db/client";
import { rawPosts, scrapeCache } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import type { Ticker } from "@/lib/db/schema";

const parser = new Parser();
// Flash layer: 30-minute cache to match CoinGecko
const CACHE_DURATION_MS = 30 * 60 * 1000;

// These RSS feeds cover all major crypto coins — we filter by coin name after fetching
const CRYPTO_RSS_FEEDS = [
  "https://www.coindesk.com/arc/outboundfeeds/rss/",
  "https://cryptoslate.com/feed/",
  "https://decrypt.co/feed",
  "https://cointelegraph.com/rss",
];

// ── ScrapeGraphAI helper ───────────────────────────────────────────────────────
// You give it a URL + a prompt, it returns structured JSON

async function scrapeWithAI(url: string, coinName: string): Promise<{
  title: string;
  content: string;
  publishedAt: string | null;
} | null> {
  try {
    const response = await fetch("https://api.scrapegraphai.com/v1/smartscraper", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "SGAI-APIKEY": process.env.SCRAPEGRAPH_API_KEY!,
      },
      body: JSON.stringify({
        website_url: url,
        user_prompt: `Extract from this crypto news article:
1. title: the article headline
2. content: the full article text (all paragraphs, keep it complete)
3. publishedAt: the publish date/time as ISO string if visible, else null

Return ONLY valid JSON with these 3 keys. No markdown, no explanation.`,
      }),
    });

    if (!response.ok) {
      console.warn(`[ScrapeGraph] Failed for ${url}: ${response.status}`);
      return null;
    }

    const data = await response.json();

    // ScrapeGraphAI returns { result: { ... } }
    const result = data.result ?? data;

    if (!result.content || result.content.length < 100) return null;

    return {
      title: result.title ?? "No title",
      content: result.content.slice(0, 8000),
      publishedAt: result.publishedAt ?? null,
    };
  } catch (error) {
    console.warn(`[ScrapeGraph] Error for ${url}:`, error);
    return null;
  }
}

// Check if an RSS item is about this coin
function isAboutCoin(ticker: Ticker, text: string): boolean {
  const lower = text.toLowerCase();
  const checks = [
    ticker.symbol.toLowerCase(),
    ticker.name.toLowerCase(),
    ticker.coingeckoId?.toLowerCase() ?? "",
  ].filter(Boolean);

  return checks.some((keyword) => lower.includes(keyword));
}

export async function scrapeNewsRSS(ticker: Ticker): Promise<number> {
  // ── Cache check ────────────────────────────────────────────────────────────
  const existing = await db.query.scrapeCache.findFirst({
    where: and(
      eq(scrapeCache.tickerId, ticker.id),
      eq(scrapeCache.sourceType, "news_rss")
    ),
  });

  if (existing) {
    const age = Date.now() - existing.lastFetchedAt.getTime();
    if (age < CACHE_DURATION_MS) {
      console.log(`[NewsRSS] ${ticker.symbol} cache is fresh, skipping`);
      return 0;
    }
  }

  console.log(`[NewsRSS] Fetching articles for ${ticker.symbol}...`);
  let inserted = 0;

  try {
    // ── Parse all RSS feeds ────────────────────────────────────────────────
    const relevantArticles: Array<{ url: string; externalId: string; postedAt: Date }> = [];

    for (const feedUrl of CRYPTO_RSS_FEEDS) {
      try {
        const feed = await parser.parseURL(feedUrl);

        for (const item of feed.items.slice(0, 20)) {
          // Only articles published in the last 5 days
          const pubDate = item.pubDate ? new Date(item.pubDate) : null;
          if (!pubDate) continue;
          const ageMs = Date.now() - pubDate.getTime();
          if (ageMs > 5 * 24 * 60 * 60 * 1000) continue;

          // Check if title/description mentions this coin
          const text = `${item.title ?? ""} ${item.contentSnippet ?? ""}`;
          if (!isAboutCoin(ticker, text)) continue;

          const url = item.link;
          if (!url) continue;

          relevantArticles.push({
            url,
            externalId: url, // URL is the unique ID for news articles
            postedAt: pubDate,
          });
        }
      } catch (feedError) {
        console.warn(`[NewsRSS] Feed failed: ${feedUrl}`, feedError);
      }
    }

    console.log(
      `[NewsRSS] Found ${relevantArticles.length} relevant articles for ${ticker.symbol}`
    );

    // ── Scrape each article with ScrapeGraphAI ─────────────────────────────
    // Limit to 5 per run (flash layer — runs every 30 min, conserve API credits)
    for (const article of relevantArticles.slice(0, 5)) {
      const scraped = await scrapeWithAI(article.url, ticker.name);
      if (!scraped) continue;

      try {
        await db
          .insert(rawPosts)
          .values({
            tickerId: ticker.id,
            sourceType: "news_rss",
            externalId: article.externalId,
            title: scraped.title.slice(0, 500),
            content: scraped.content,
            author: "Crypto News",
            url: article.url,
            upvotes: 0,
            postedAt: scraped.publishedAt
              ? new Date(scraped.publishedAt)
              : article.postedAt,
          })
          .onConflictDoNothing();

        inserted++;
      } catch {
        // skip duplicates
      }

      // Small delay between ScrapeGraph calls to avoid rate limits
      await new Promise((r) => setTimeout(r, 1500));
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