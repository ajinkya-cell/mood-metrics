// Reddit scraper — Arctic Shift primary source
//
// Reddit's public JSON API (reddit.com/r/x.json) is 403-blocked on all
// server/cloud IPs (Vercel, AWS, etc.) due to Cloudflare protection, and
// Reddit has shut down self-service OAuth app creation as of 2025.
//
// Strategy: skip reddit.com entirely, go straight to Arctic Shift.
// Arctic Shift (arctic-shift.photon-reddit.com) is a public Reddit archive
// that mirrors posts with ~1–6h delay — good enough for the 35% historic layer.
//
// Defenses retained:
//   A. AbortController timeout — no hanging serverless functions
//   F. Content filtering — strips stickied posts, deleted/removed content
//   G. Concurrent cron guard — DB lock prevents duplicate runs

import { db } from "@/lib/db/client";
import { rawPosts, scrapeCache } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import type { Ticker } from "@/lib/db/schema";

// ── Constants ────────────────────────────────────────────────────────────────

const CACHE_DURATION_MS = 4 * 60 * 60 * 1000;  // 4 hours
const FETCH_TIMEOUT_MS  = 25_000;                // 25s — Arctic Shift can be slow for larger subreddits

// ── User-Agent rotation ───────────────────────────────────────────────────────
// Arctic Shift doesn't require this but a realistic UA avoids any CDN blocks.
// IMPORTANT: never include "Bot" in any agent — Reddit's Cloudflare instantly flags it.
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0",
];

function randomAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// Jitter: adds ±20% randomness to any delay so multiple Vercel instances
// don't all retry at the exact same millisecond (thundering herd)
function jitter(ms: number): number {
  return ms * (0.8 + Math.random() * 0.4);
}

// ── Types ─────────────────────────────────────────────────────────────────────

type RedditPostData = {
  id: string;
  title: string;
  selftext: string;        // "" for link posts, "[removed]" for mod-removed
  author: string;          // "t2_xxx" or "[deleted]"
  permalink: string;
  score: number;
  num_comments: number;
  created_utc: number;
  is_self: boolean;        // true = text post, false = link post
  stickied: boolean;       // true = mod megathread, pinned announcement
  distinguished: string | null; // "moderator" | "admin" | null
  locked: boolean;         // locked threads have no new signal
};

type RedditPost   = { data: RedditPostData };
type RedditListing = { data: { children: RedditPost[] } };

// ── Defense F: Content filter ─────────────────────────────────────────────────
// Returns true if a post is worth keeping for sentiment analysis.

function isUsablePost(d: RedditPostData): boolean {
  // Skip stickied mod posts (weekly discussions, price megathreads etc.)
  if (d.stickied) return false;

  // Skip mod/admin distinguished posts — these are announcements, not sentiment
  if (d.distinguished === "moderator" || d.distinguished === "admin") return false;

  // Skip deleted author
  if (!d.author || d.author === "[deleted]") return false;

  // Skip removed content — "[removed]" body with no title signal
  if (d.selftext === "[removed]" || d.selftext === "[deleted]") return false;

  // Skip locked threads — no recent community engagement
  if (d.locked) return false;

  // Need meaningful text — title alone must be at least 20 chars
  const combined = [d.title, d.is_self ? d.selftext : ""]
    .filter(Boolean)
    .join(" ")
    .trim();
  if (combined.length < 20) return false;

  return true;
}

// ── Subreddit mappings per ticker ─────────────────────────────────────────────
export const SUBREDDITS_BY_TICKER: Record<string, string[]> = {
  BTC: ["bitcoin", "BitcoinMarkets", "btc", "CryptoCurrency", "CryptoMarkets"],
  ETH: ["ethereum", "ethtrader", "ethfinance", "CryptoCurrency", "CryptoMarkets"],
  SOL: ["solana", "SolanaTrading", "CryptoCurrency", "CryptoMarkets"],
};

// ── Primary source: Arctic Shift ─────────────────────────────────────────────
// Arctic Shift is a public Reddit archive (~1–6h delay).
// API docs: https://github.com/ArthurHeitmann/arctic_shift/blob/master/api/README.md
//   sort must be "asc" | "desc" (sorts by created_utc). "score" is NOT valid.

type ArcticPost = {
  id: string;
  title: string;
  selftext: string;
  author: string;
  permalink: string;
  score: number;
  num_comments: number;
  created_utc: number;
};

async function fetchFromArcticShift(
  subreddit: string,
  limit = 100,
  before?: number
): Promise<RedditPost[]> {
  let url =
    `https://arctic-shift.photon-reddit.com/api/posts/search` +
    `?subreddit=${subreddit}&limit=${limit}&sort=desc`;
  if (before) {
    url += `&before=${before}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": randomAgent() },
    });

    clearTimeout(timer);

    if (!res.ok) {
      console.warn(`[ArcticShift] Failed: HTTP ${res.status} for r/${subreddit}`);
      return [];
    }

    const data = (await res.json()) as { data: ArcticPost[] };
    const posts = data?.data ?? [];

    return posts.map((p) => ({
      data: {
        id: p.id,
        title: p.title,
        selftext: p.selftext ?? "",
        author: p.author,
        permalink: p.permalink ?? `/r/${subreddit}/comments/${p.id}`,
        score: p.score ?? 0,
        num_comments: p.num_comments ?? 0,
        created_utc: p.created_utc,
        is_self: true,
        stickied: false,
        distinguished: null,
        locked: false,
      },
    }));
  } catch {
    clearTimeout(timer);
    console.warn(`[ArcticShift] Request failed for r/${subreddit}`);
    return [];
  }
}

async function fetchArcticShiftPaginated(
  subreddit: string,
  maxPages = 5,
  minCreatedUtc?: number
): Promise<RedditPost[]> {
  const allPosts: RedditPost[] = [];
  const seenIds = new Set<string>();
  let currentBefore: number | undefined = undefined;

  console.log(
    `[ArcticShift] Paginated fetch for r/${subreddit} (maxPages=${maxPages}${
      minCreatedUtc ? `, minDate=${new Date(minCreatedUtc * 1000).toISOString()}` : ""
    })`
  );

  for (let page = 0; page < maxPages; page++) {
    const posts = await fetchFromArcticShift(subreddit, 100, currentBefore);
    if (posts.length === 0) break;

    let newPostsInPage = 0;
    let reachedMinTime = false;

    for (const post of posts) {
      if (seenIds.has(post.data.id)) continue;
      seenIds.add(post.data.id);

      if (minCreatedUtc && post.data.created_utc < minCreatedUtc) {
        reachedMinTime = true;
        break;
      }

      allPosts.push(post);
      newPostsInPage++;
    }

    const oldest = posts[posts.length - 1];
    if (!oldest || newPostsInPage === 0 || reachedMinTime) {
      break;
    }

    currentBefore = oldest.data.created_utc;
    await sleep(jitter(350));
  }

  return allPosts;
}

// ── Public export ─────────────────────────────────────────────────────────────

type ScrapeRedditOptions = {
  force?: boolean;
  lookbackDays?: number;
  maxPagesPerSub?: number;
};

export async function scrapeReddit(ticker: Ticker, opts?: ScrapeRedditOptions): Promise<number> {
  if (!ticker.redditName) {
    console.log(`[Reddit] No subreddit configured for ${ticker.symbol}`);
    return 0;
  }

  // ── Cache check ──────────────────────────────────────────────────────────
  if (!opts?.force) {
    const existing = await db.query.scrapeCache.findFirst({
      where: and(
        eq(scrapeCache.tickerId, ticker.id),
        eq(scrapeCache.sourceType, "reddit")
      ),
    });

    if (existing) {
      const age = Date.now() - existing.lastFetchedAt.getTime();
      const isFresh = age < CACHE_DURATION_MS;
      const isFailed = existing.status === "error" || (existing.postCount ?? 0) === 0;

      // Retry if previous attempt errored OR returned 0 posts (likely blocked)
      if (isFresh && !isFailed) {
        console.log(`[Reddit] ${ticker.symbol} cache fresh (${Math.round(age / 60000)}m old), skipping`);
        return 0;
      }

      if (isFailed) {
        console.log(`[Reddit] ${ticker.symbol} previous attempt ${existing.status} (${existing.postCount} posts) — retrying`);
      }
    }
  }

  // ── Defense G: Mark as "in progress" immediately ─────────────────────────
  await db
    .insert(scrapeCache)
    .values({
      tickerId: ticker.id,
      sourceType: "reddit",
      lastFetchedAt: new Date(),
      status: "in_progress",
    })
    .onConflictDoUpdate({
      target: [scrapeCache.tickerId, scrapeCache.sourceType],
      set: { lastFetchedAt: new Date(), status: "in_progress" },
    });

  const targetSubreddits = SUBREDDITS_BY_TICKER[ticker.symbol.toUpperCase()] ?? [ticker.redditName];
  console.log(`[Reddit] Fetching subreddits for ${ticker.symbol}: ${targetSubreddits.join(", ")}...`);

  try {
    const allPosts: RedditPost[] = [];
    const lookbackDays = opts?.lookbackDays ?? 14;
    const maxPages = opts?.maxPagesPerSub ?? 6;
    const minCreatedUtc = Math.floor(Date.now() / 1000) - lookbackDays * 24 * 60 * 60;

    // Fetch across all targeted subreddits with deep pagination
    for (const sub of targetSubreddits) {
      const subPosts = await fetchArcticShiftPaginated(sub, maxPages, minCreatedUtc);
      allPosts.push(...subPosts);
      await sleep(jitter(400));
    }

    // Keyword filter for generic / multi-coin subreddits (e.g. CryptoCurrency, CryptoMarkets)
    const keyword = ticker.name.toLowerCase();
    const symbol = ticker.symbol.toLowerCase();
    const isSol = ticker.symbol.toUpperCase() === "SOL";
    const isEth = ticker.symbol.toUpperCase() === "ETH";
    const isBtc = ticker.symbol.toUpperCase() === "BTC";

    const filteredByCoin = allPosts.filter((p) => {
      // Posts from dedicated primary subreddits are inherently about this coin
      const permalink = p.data.permalink.toLowerCase();
      if (
        (isBtc && (permalink.includes("/r/bitcoin/") || permalink.includes("/r/btc/") || permalink.includes("/r/bitcoinmarkets/"))) ||
        (isEth && (permalink.includes("/r/ethereum/") || permalink.includes("/r/ethtrader/") || permalink.includes("/r/ethfinance/"))) ||
        (isSol && (permalink.includes("/r/solana/") || permalink.includes("/r/solanatrading/")))
      ) {
        return true;
      }

      const text = `${p.data.title} ${p.data.selftext}`.toLowerCase();
      if (isSol) {
        return (
          text.includes("solana") ||
          text.includes("$sol") ||
          /\bsol\b/i.test(text) ||
          text.includes("phantom wallet") ||
          text.includes("pump.fun") ||
          text.includes("raydium")
        );
      }
      if (isEth) {
        return (
          text.includes("ethereum") ||
          text.includes("ether") ||
          text.includes("$eth") ||
          /\beth\b/i.test(text) ||
          text.includes("vitalik") ||
          text.includes("erc20") ||
          text.includes("erc-20")
        );
      }
      if (isBtc) {
        return (
          text.includes("bitcoin") ||
          text.includes("satoshi") ||
          text.includes("$btc") ||
          /\bbtc\b/i.test(text) ||
          text.includes("sats")
        );
      }

      return text.includes(keyword) || text.includes(`$${symbol}`) || new RegExp(`\\b${symbol}\\b`, "i").test(text);
    });

    // Defense F: filter before inserting
    const usable = filteredByCoin.filter((p) => isUsablePost(p.data));
    console.log(
      `[ArcticShift] ${ticker.symbol}: ${allPosts.length} total fetched → ${filteredByCoin.length} coin-matched → ${usable.length} usable after content filter`
    );

    const rowsToInsert = usable.map((post) => {
      const {
        id, title, selftext, author,
        permalink, score, num_comments, created_utc, is_self,
      } = post.data;

      const content = [title, is_self ? selftext : ""]
        .filter(Boolean)
        .join("\n\n")
        .trim()
        .slice(0, 5000);

      return {
        tickerId:     ticker.id,
        sourceType:   "reddit" as const,
        externalId:   id,
        title:        title.slice(0, 500),
        content,
        author:       author ?? "unknown",
        url:          `https://reddit.com${permalink}`,
        upvotes:      score,
        commentCount: num_comments,
        postedAt:     new Date(created_utc * 1000),
      };
    });

    let inserted = 0;
    const batchSize = 50;
    for (let i = 0; i < rowsToInsert.length; i += batchSize) {
      const batch = rowsToInsert.slice(i, i + batchSize);
      try {
        // Count what was written: rows this ticker already has are skipped
        const written = await db.insert(rawPosts).values(batch).onConflictDoNothing().returning({ id: rawPosts.id });
        inserted += written.length;
      } catch (insertErr) {
        console.warn(`[Reddit] Batch insert warning for ${ticker.symbol}:`, insertErr);
      }
    }

    // ── Update cache to "success" ──────────────────────────────────────────
    await db
      .insert(scrapeCache)
      .values({
        tickerId:      ticker.id,
        sourceType:    "reddit",
        lastFetchedAt: new Date(),
        postCount:     inserted,
        status:        "success",
      })
      .onConflictDoUpdate({
        target: [scrapeCache.tickerId, scrapeCache.sourceType],
        set: {
          lastFetchedAt: new Date(),
          postCount:     inserted,
          status:        "success",
          errorMessage:  null,
        },
      });

    console.log(`[Reddit] ${ticker.symbol}: inserted ${inserted} posts`);
    return inserted;

  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error(`[Reddit] ${ticker.symbol} failed:`, msg);

    await db
      .insert(scrapeCache)
      .values({
        tickerId:      ticker.id,
        sourceType:    "reddit",
        lastFetchedAt: new Date(),
        status:        "error",
        errorMessage:  msg,
      })
      .onConflictDoUpdate({
        target: [scrapeCache.tickerId, scrapeCache.sourceType],
        set: { status: "error", errorMessage: msg, lastFetchedAt: new Date() },
      });

    return 0;
  }
}