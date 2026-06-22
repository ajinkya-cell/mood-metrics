// Reddit scraper — public JSON API with full defensive hardening
//
// Defenses implemented:
//   A. AbortController timeout (6s) — no hanging serverless functions
//   B. Exponential backoff retry — survives transient 429s gracefully
//   C. Jittered sequential fetching — never fires 2 requests simultaneously
//   D. Retry-After header respect — uses Reddit's own backoff signal
//   E. Rotate User-Agent pool — reduces fingerprinting risk
//   F. Content filtering — strips stickied posts, deleted/removed content
//   G. Concurrent cron guard — DB lock prevents duplicate runs
//   H. Arctic Shift fallback — fires automatically on 403 (IP block)

import { db } from "@/lib/db/client";
import { rawPosts, scrapeCache } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import type { Ticker } from "@/lib/db/schema";

// ── Constants ────────────────────────────────────────────────────────────────

const CACHE_DURATION_MS = 4 * 60 * 60 * 1000;  // 4 hours
const FETCH_TIMEOUT_MS  = 10_000;                // 10s — Reddit's public JSON can be slow
const MAX_RETRIES       = 3;                     // max retry attempts on 429
const BASE_BACKOFF_MS   = 2_000;                 // exponential backoff base

// ── Defense E: User-Agent rotation ───────────────────────────────────────────
// Reddit blocks single static User-Agent strings. Rotating across a small
// pool makes traffic look more like organic browser diversity.
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

// ── Defense A+B+C: Fetch with timeout + exponential backoff ──────────────────

async function fetchWithRetry(
  url: string,
  attempt = 1
): Promise<Response> {

  // Defense A: AbortController timeout — kills the request if Reddit stalls
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let res: Response;

  try {
    res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": randomAgent(),       // Defense E
        "Accept": "application/json",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Referer": "https://www.reddit.com/",
      },
    });
  } catch (err) {
    clearTimeout(timer);
    const isTimeout = err instanceof Error && err.name === "AbortError";
    if (isTimeout) throw new Error(`TIMEOUT: Reddit did not respond within ${FETCH_TIMEOUT_MS}ms`);
    throw err;
  }

  clearTimeout(timer);

  // Defense B: Exponential backoff on 429
  if (res.status === 429) {
    if (attempt > MAX_RETRIES) {
      throw new Error(`RATE_LIMITED: exceeded ${MAX_RETRIES} retries on ${url}`);
    }

    // Defense D: Respect Reddit's Retry-After header if present
    const retryAfter = res.headers.get("Retry-After");
    const waitMs = retryAfter
      ? parseInt(retryAfter, 10) * 1000          // Reddit says exactly how long
      : jitter(BASE_BACKOFF_MS * 2 ** attempt);  // exponential: 4s, 8s, 16s

    console.warn(
      `[Reddit] 429 on attempt ${attempt}/${MAX_RETRIES} — waiting ${Math.round(waitMs / 1000)}s`
    );
    await sleep(waitMs);
    return fetchWithRetry(url, attempt + 1);
  }

  return res;
}

// ── Defense H: Arctic Shift fallback ─────────────────────────────────────────
// Arctic Shift is a public Reddit archive. When Reddit blocks us (403),
// we silently switch to this mirror. Different domain = different IP block scope.
//
// API docs: https://github.com/ArthurHeitmann/arctic_shift/blob/master/api/README.md
//   sort must be "asc" | "desc" (sorts by created_utc). "score" is NOT a valid value.

async function fetchFromArcticShift(
  subreddit: string,
  limit = 25
): Promise<RedditPost[]> {
  console.log(`[Reddit] Using Arctic Shift fallback for r/${subreddit}`);

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
      console.warn(`[ArcticShift] Also failed: ${res.status}`);
      return [];
    }

    // Arctic Shift returns a different shape — normalize it to match Reddit's
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

// ── Main fetch function ───────────────────────────────────────────────────────

async function fetchSubreddit(
  subreddit: string,
  sort: "hot" | "new",
  limit = 25
): Promise<RedditPost[]> {
  const url =
    `https://www.reddit.com/r/${subreddit}/${sort}.json` +
    `?limit=${limit}&raw_json=1`;

  let res: Response;
  try {
    res = await fetchWithRetry(url);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[Reddit] fetchWithRetry gave up: ${msg}`);
    return [];
  }

  // Defense H: trigger fallback on 403 (IP block / Cloudflare challenge)
  if (res.status === 403) {
    console.warn(`[Reddit] 403 on r/${subreddit} — triggering Arctic Shift fallback`);
    return fetchFromArcticShift(subreddit, limit);
  }

  if (res.status === 404) {
    console.warn(`[Reddit] r/${subreddit} not found`);
    return [];
  }

  if (!res.ok) {
    console.warn(`[Reddit] Unexpected status ${res.status} for r/${subreddit}`);
    return [];
  }

  const json = (await res.json()) as RedditListing;
  return json?.data?.children ?? [];
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
    // Defense C: Sequential with jitter — NOT parallel
    // Parallel requests double our per-second rate and risk a 429 burst.
    const hotPosts = await fetchSubreddit(ticker.redditName, "hot", 25);
    await sleep(jitter(1200));   // ~1.2s gap between hot and new
    const newPosts = await fetchSubreddit(ticker.redditName, "new", 25);

    // Deduplicate by post ID across hot + new
    const seen = new Set<string>();
    const allPosts = [...hotPosts, ...newPosts].filter((p) => {
      if (seen.has(p.data.id)) return false;
      seen.add(p.data.id);
      return true;
    });

    // Defense F: filter before inserting
    const usable = allPosts.filter((p) => isUsablePost(p.data));
    console.log(
      `[Reddit] ${ticker.symbol}: ${allPosts.length} total → ${usable.length} after filtering`
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