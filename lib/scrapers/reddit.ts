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

// ── Primary source: Arctic Shift ─────────────────────────────────────────────
// Arctic Shift is a public Reddit archive (~1–6h delay).
// API docs: https://github.com/ArthurHeitmann/arctic_shift/blob/master/api/README.md
//   sort must be "asc" | "desc" (sorts by created_utc). "score" is NOT valid.

async function fetchFromArcticShift(
  subreddit: string,
  limit = 50
): Promise<RedditPost[]> {
  console.log(`[ArcticShift] Fetching r/${subreddit} (limit=${limit})`);

  const url =
    `https://arctic-shift.photon-reddit.com/api/posts/search` +
    `?subreddit=${subreddit}&limit=${limit}&sort=desc`;

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

    type ArcticPost = {
      id: string; title: string; selftext: string;
      author: string; permalink: string;
      score: number; num_comments: number; created_utc: number;
    };

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

// ── Public export ─────────────────────────────────────────────────────────────

export async function scrapeReddit(ticker: Ticker): Promise<number> {
  if (!ticker.redditName) {
    console.log(`[Reddit] No subreddit configured for ${ticker.symbol}`);
    return 0;
  }

  // ── Cache check ──────────────────────────────────────────────────────────
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

  // ── Defense G: Mark as "in progress" immediately ─────────────────────────
  // If two cron jobs fire at the same time (Vercel cold start overlap),
  // the second one will see a recent lastFetchedAt and skip itself.
  await db
    .insert(scrapeCache)
    .values({
      tickerId: ticker.id,
      sourceType: "reddit",
      lastFetchedAt: new Date(),   // claim the slot NOW
      status: "in_progress",
    })
    .onConflictDoUpdate({
      target: [scrapeCache.tickerId, scrapeCache.sourceType],
      set: { lastFetchedAt: new Date(), status: "in_progress" },
    });

  console.log(`[Reddit] Fetching r/${ticker.redditName}...`);

  try {
    // Go straight to Arctic Shift — skip reddit.com entirely
    // (reddit.com 403s on all server IPs; Arctic Shift is our primary source)
    let allPosts = await fetchFromArcticShift(ticker.redditName, 25);

    // Fallback: if the subreddit isn't indexed by Arctic Shift (e.g. r/solana),
    // fetch r/CryptoCurrency (well-indexed) and filter client-side by ticker name.
    // NOTE: Arctic Shift's /api/posts/search does NOT support a `q` keyword param —
    // it returns 400. We fetch broadly and filter here instead.
    if (allPosts.length === 0) {
      console.log(`[ArcticShift] r/${ticker.redditName} empty — falling back to r/CryptoCurrency for ${ticker.symbol}`);
      const fallbackUrl =
        `https://arctic-shift.photon-reddit.com/api/posts/search` +
        `?subreddit=CryptoCurrency&limit=100&sort=desc`;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      try {
        const res = await fetch(fallbackUrl, {
          signal: controller.signal,
          headers: { "User-Agent": randomAgent() },
        });
        clearTimeout(timer);
        if (res.ok) {
          type ArcticPost = {
            id: string; title: string; selftext: string;
            author: string; permalink: string;
            score: number; num_comments: number; created_utc: number;
          };
          const data = (await res.json()) as { data: ArcticPost[] };
          const raw = data?.data ?? [];

          // Client-side keyword filter — keep only posts mentioning this ticker
          const keyword = ticker.name.toLowerCase(); // e.g. "solana"
          const symbol  = ticker.symbol.toLowerCase(); // e.g. "sol"
          const filtered = raw.filter((p) => {
            const text = `${p.title} ${p.selftext ?? ""}`.toLowerCase();
            return text.includes(keyword) || text.includes(`$${symbol}`);
          });

          allPosts = filtered.map((p) => ({
            data: {
              id: p.id, title: p.title, selftext: p.selftext ?? "",
              author: p.author,
              permalink: p.permalink ?? `/r/CryptoCurrency/comments/${p.id}`,
              score: p.score ?? 0, num_comments: p.num_comments ?? 0,
              created_utc: p.created_utc, is_self: true,
              stickied: false, distinguished: null, locked: false,
            },
          }));
          console.log(`[ArcticShift] r/CryptoCurrency fallback: ${raw.length} total → ${allPosts.length} matching "${keyword}"`);
        } else {
          clearTimeout(timer);
          console.warn(`[ArcticShift] r/CryptoCurrency fallback HTTP ${res.status}`);
        }
      } catch {
        clearTimeout(timer);
        console.warn(`[ArcticShift] r/CryptoCurrency fallback request failed`);
      }
    }

    // Defense F: filter before inserting
    const usable = allPosts.filter((p) => isUsablePost(p.data));
    console.log(
      `[ArcticShift] ${ticker.symbol}: ${allPosts.length} total → ${usable.length} after filtering`
    );



    let inserted = 0;

    for (const post of usable) {
      const {
        id, title, selftext, author,
        permalink, score, num_comments, created_utc, is_self,
      } = post.data;

      // For link posts (is_self=false) we only have the title — that's fine,
      // the title alone is enough for sentiment analysis.
      const content = [title, is_self ? selftext : ""]
        .filter(Boolean)
        .join("\n\n")
        .trim()
        .slice(0, 5000);

      try {
        await db
          .insert(rawPosts)
          .values({
            tickerId:     ticker.id,
            sourceType:   "reddit",
            externalId:   id,
            title:        title.slice(0, 500),
            content,
            author:       author ?? "unknown",
            url:          `https://reddit.com${permalink}`,
            upvotes:      score,
            commentCount: num_comments,
            postedAt:     new Date(created_utc * 1000),
          })
          .onConflictDoNothing();

        inserted++;
      } catch {
        // duplicate — safe to ignore
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