import { db } from "../lib/db/client";
import { tickers, rawPosts, sentimentRecords } from "../lib/db/schema";
import { analyzePendingPosts, rollupTimeseries, recordBlendedSentiment } from "../lib/ai/sentiment";
import { eq, sql } from "drizzle-orm";

async function backfill() {
  console.log("=== BACKFILL SENTIMENT ANALYSIS ===");

  const activeTickers = await db.query.tickers.findMany({
    where: eq(tickers.isActive, true),
  });

  for (const ticker of activeTickers) {
    console.log(`\n========================================`);
    console.log(`Processing ${ticker.name} (${ticker.symbol})...`);
    console.log(`========================================`);

    // Count pending posts for this ticker
    const [pendingCountResult] = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(rawPosts)
      .leftJoin(sentimentRecords, eq(rawPosts.id, sentimentRecords.postId))
      .where(
        sql`${rawPosts.tickerId} = ${ticker.id} AND ${sentimentRecords.id} IS NULL`
      );

    const pendingTotal = pendingCountResult?.count ?? 0;
    console.log(`[${ticker.symbol}] Total pending posts to analyze: ${pendingTotal}`);

    let processed = 0;
    const batchSize = 30;

    while (true) {
      const analyzed = await analyzePendingPosts(ticker, batchSize);
      if (analyzed === 0) break;
      processed += analyzed;
      console.log(`[${ticker.symbol}] Progress: analyzed ${processed} / ${pendingTotal} posts`);
      // Brief breathing delay
      await new Promise((r) => setTimeout(r, 500));
    }

    console.log(`[${ticker.symbol}] Finished AI analysis. Rebuilding timeseries rollups...`);
    await rollupTimeseries(ticker);

    console.log(`[${ticker.symbol}] Recording fresh blended sentiment...`);
    await recordBlendedSentiment(ticker);
  }

  console.log("\n✅ Backfill completed successfully for all active tickers!");
}

backfill()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Backfill error:", err);
    process.exit(1);
  });
