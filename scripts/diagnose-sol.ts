/**
 * diagnose-sol.ts
 * Run: npx tsx --env-file=.env scripts/diagnose-sol.ts
 *
 * Checks every stage of the SOL data pipeline to pinpoint where data goes missing.
 */

import { db } from "../lib/db/client";
import { tickers, rawPosts, sentimentRecords, sentimentTimeseries, scrapeCache } from "../lib/db/schema";
import { eq, and, desc, gte } from "drizzle-orm";

async function diagnose() {
  console.log("=== SOL PIPELINE DIAGNOSTIC ===\n");

  // 1. Check ticker exists
  const ticker = await db.query.tickers.findFirst({
    where: eq(tickers.symbol, "SOL"),
  });

  if (!ticker) {
    console.error("❌ SOL ticker NOT FOUND in DB. Run seed first.");
    process.exit(1);
  }
  console.log(`✅ Ticker found: id=${ticker.id}, name=${ticker.name}, redditName=${ticker.redditName}`);
  console.log(`   coingeckoId=${ticker.coingeckoId}, isActive=${ticker.isActive}\n`);

  // 2. Check scrape_cache
  const cacheEntries = await db.query.scrapeCache.findMany({
    where: eq(scrapeCache.tickerId, ticker.id),
  });

  console.log("── scrape_cache entries ─────────────────────");
  if (cacheEntries.length === 0) {
    console.log("  ⚠️  No cache entries at all.");
  }
  for (const c of cacheEntries) {
    const ageMin = Math.round((Date.now() - c.lastFetchedAt.getTime()) / 60000);
    console.log(
      `  ${c.sourceType}: status=${c.status}, postCount=${c.postCount}, age=${ageMin}m ago` +
      (c.errorMessage ? `, error="${c.errorMessage}"` : "")
    );
  }
  console.log();

  // 3. Check raw_posts count per source
  const allRawPosts = await db.query.rawPosts.findMany({
    where: eq(rawPosts.tickerId, ticker.id),
    orderBy: [desc(rawPosts.scrapedAt)],
    limit: 100,
  });

  const bySource: Record<string, number> = {};
  for (const p of allRawPosts) {
    bySource[p.sourceType] = (bySource[p.sourceType] || 0) + 1;
  }

  console.log("── raw_posts ─────────────────────────────────");
  console.log(`  Total posts: ${allRawPosts.length}`);
  for (const [src, cnt] of Object.entries(bySource)) {
    console.log(`  ${src}: ${cnt} posts`);
  }

  if (allRawPosts.length > 0) {
    const latest = allRawPosts[0];
    console.log(`  Latest post: "${latest.title?.slice(0, 60)}..." (${latest.sourceType}, ${latest.postedAt.toISOString()})`);
  }
  console.log();

  // 4. Check sentiment_records
  const sentRecords = await db
    .select({ count: rawPosts.id, source: rawPosts.sourceType })
    .from(sentimentRecords)
    .innerJoin(rawPosts, eq(sentimentRecords.postId, rawPosts.id))
    .where(eq(rawPosts.tickerId, ticker.id));

  const sentBySource: Record<string, number> = {};
  for (const s of sentRecords) {
    sentBySource[s.source] = (sentBySource[s.source] || 0) + 1;
  }

  console.log("── sentiment_records ─────────────────────────");
  console.log(`  Total analyzed: ${sentRecords.length}`);
  for (const [src, cnt] of Object.entries(sentBySource)) {
    console.log(`  ${src}: ${cnt} analyzed`);
  }
  console.log();

  // 5. Check timeseries
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const ts = await db.query.sentimentTimeseries.findMany({
    where: and(
      eq(sentimentTimeseries.tickerId, ticker.id),
      eq(sentimentTimeseries.interval, "1h"),
      gte(sentimentTimeseries.bucketStart, oneDayAgo)
    ),
    orderBy: [desc(sentimentTimeseries.bucketStart)],
  });

  console.log("── sentiment_timeseries (last 24h 1h buckets) ──");
  console.log(`  Buckets: ${ts.length}`);
  if (ts.length > 0) {
    console.log(`  Latest bucket: ${ts[0].bucketStart.toISOString()}, totalPosts=${ts[0].totalPosts}, avgScore=${ts[0].avgScore}`);
  }
  console.log();

  // 6. What the analyze endpoint would see
  const recentBuckets = ts.slice(0, 4);
  const historicScore = recentBuckets.length > 0
    ? recentBuckets.reduce((s, b) => s + parseFloat(b.volumeWeightedScore ?? "0"), 0) / recentBuckets.length
    : 0;

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const flashPosts = await db
    .select({ score: sentimentRecords.score, source: rawPosts.sourceType })
    .from(sentimentRecords)
    .innerJoin(rawPosts, eq(sentimentRecords.postId, rawPosts.id))
    .where(and(
      eq(rawPosts.tickerId, ticker.id),
      gte(rawPosts.postedAt, twentyFourHoursAgo),
    ));
  const flashOnly = flashPosts.filter(p => p.source === "coingecko" || p.source === "news_rss");

  console.log("── What /api/analyze?symbol=SOL would compute ──");
  console.log(`  L1 flashPostsUsed: ${flashOnly.length}  (coingecko+news posts with sentiment in last 24h)`);
  console.log(`  L2 historicBucketsUsed: ${recentBuckets.length}  (timeseries buckets in last 4h)`);
  console.log(`  historicScore: ${historicScore}`);
  console.log();

  // 7. Diagnose root cause
  console.log("── ROOT CAUSE ANALYSIS ─────────────────────────");

  const redditCache = cacheEntries.find(c => c.sourceType === "reddit");
  const newsCache = cacheEntries.find(c => c.sourceType === "news_rss");
  const geckoCache = cacheEntries.find(c => c.sourceType === "coingecko");

  if (!redditCache || redditCache.status === "error" || (redditCache.postCount ?? 0) === 0) {
    console.log("  ❌ L2 PROBLEM: Reddit scrape has 0 posts or errored.");
    console.log("     → No raw_posts → No sentiment_records → No timeseries → historicBucketsUsed=0");
  } else if (ts.length === 0) {
    console.log("  ❌ L2 PROBLEM: Reddit posts exist but rollupTimeseries was never run.");
    console.log(`     → raw_posts by reddit: ${bySource['reddit'] ?? 0}`);
    console.log(`     → sentiment_records by reddit: ${sentBySource['reddit'] ?? 0}`);
  }

  if ((!newsCache || (newsCache.postCount ?? 0) === 0) && (!geckoCache || (geckoCache.postCount ?? 0) === 0)) {
    console.log("  ❌ L1 PROBLEM: Both CoinGecko and news_rss scraped 0 posts.");
    console.log("     → No flash posts → flashPostsUsed=0");
  } else if (flashOnly.length === 0) {
    console.log("  ⚠️  L1 PROBLEM: Posts were scraped but NOT analyzed yet.");
    console.log(`     → coingecko posts scraped: ${bySource['coingecko'] ?? 0}`);
    console.log(`     → news_rss posts scraped:  ${bySource['news_rss'] ?? 0}`);
    console.log(`     → Flash posts with sentiment (last 24h): ${flashOnly.length}`);
    console.log("     → Fix: call analyzePendingPosts(ticker) or hit /api/analyze?symbol=SOL to trigger inline analysis");
  }

  if (ts.length === 0 && (bySource['reddit'] ?? 0) > 0 && (sentBySource['reddit'] ?? 0) > 0) {
    console.log("  ❌ L2 PROBLEM: Sentiment records exist but rollupTimeseries wasn't called.");
  }

  console.log("\n=== DONE ===");
  process.exit(0);
}

diagnose().catch(e => {
  console.error("Fatal:", e);
  process.exit(1);
});
