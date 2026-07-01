/**
 * verify-sol-fix.ts
 * Run: npx tsx --env-file=.env scripts/verify-sol-fix.ts
 *
 * Verifies the fix is working using the new 7-day window that matches analyze route.
 */

import { db } from "../lib/db/client";
import { tickers, rawPosts, sentimentRecords, sentimentTimeseries } from "../lib/db/schema";
import { eq, and, desc, gte } from "drizzle-orm";

async function verify() {
  console.log("=== VERIFY SOL FIX (7-day window) ===\n");

  const ticker = await db.query.tickers.findFirst({
    where: eq(tickers.symbol, "SOL"),
  });

  if (!ticker) {
    console.error("❌ SOL ticker NOT FOUND");
    process.exit(1);
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Check timeseries with 7-day window
  const ts = await db.query.sentimentTimeseries.findMany({
    where: and(
      eq(sentimentTimeseries.tickerId, ticker.id),
      eq(sentimentTimeseries.interval, "1h"),
      gte(sentimentTimeseries.bucketStart, sevenDaysAgo)
    ),
    orderBy: [desc(sentimentTimeseries.bucketStart)],
  });

  const recentBuckets = ts.slice(0, 24);
  const historicScore =
    recentBuckets.length > 0
      ? recentBuckets.reduce((s, b) => s + parseFloat(b.volumeWeightedScore ?? "0"), 0) / recentBuckets.length
      : 0;

  // Check flash posts with 7-day window
  const flashPosts = await db
    .select({ score: sentimentRecords.score, source: rawPosts.sourceType })
    .from(sentimentRecords)
    .innerJoin(rawPosts, eq(sentimentRecords.postId, rawPosts.id))
    .where(and(
      eq(rawPosts.tickerId, ticker.id),
      gte(rawPosts.postedAt, sevenDaysAgo)
    ));
  const flashOnly = flashPosts.filter(p => p.source === "coingecko" || p.source === "news_rss");
  const flashScore = flashOnly.length > 0
    ? flashOnly.reduce((s, p) => s + parseFloat(p.score ?? "0"), 0) / flashOnly.length
    : historicScore;

  console.log("L2 — HISTORIC REDDIT (35%)");
  console.log(`  Timeseries buckets (7d window): ${ts.length}`);
  console.log(`  Recent buckets used (up to 24): ${recentBuckets.length}`);
  console.log(`  historicScore: ${historicScore.toFixed(4)}  (displayed as ${Math.round(historicScore * 100)})`);
  
  if (ts.length > 0) {
    console.log(`  Latest bucket: ${ts[0].bucketStart.toISOString()}`);
    console.log(`  ✅ L2 will show non-zero data`);
  } else {
    console.log(`  ❌ L2 still empty — no buckets in 7-day window`);
  }

  console.log("\nL1 — FLASH NEWS (45%)");
  console.log(`  Flash posts (7d window): ${flashOnly.length} (coingecko + news_rss with sentiment)`);
  console.log(`  flashScore: ${flashScore.toFixed(4)}  (displayed as ${Math.round(flashScore * 100)})`);

  if (flashOnly.length > 0) {
    console.log(`  ✅ L1 will show ${flashOnly.length} items`);
  } else {
    console.log(`  ⚠️  L1 flashPostsUsed=0 but score falls back to historicScore=${historicScore.toFixed(4)}`);
  }

  console.log("\n=== SUMMARY ===");
  const l2Works = ts.length > 0;
  const l1Works = flashOnly.length > 0;
  
  if (l1Works && l2Works) {
    console.log("✅ BOTH L1 and L2 should now display real data in the dashboard");
  } else {
    if (!l2Works) console.log("❌ L2 still not working — timeseries buckets may be outside 7-day range");
    if (!l1Works) console.log("⚠️  L1 shows 0 items but falls back to historicScore — scores will still be non-zero");
  }

  process.exit(0);
}

verify().catch(e => {
  console.error("Fatal:", e);
  process.exit(1);
});
