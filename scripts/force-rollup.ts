/**
 * force-rollup.ts
 * Run: npx tsx --env-file=.env scripts/force-rollup.ts
 *
 * Forces rollupTimeseries for all tickers using already-analyzed posts.
 * This fixes the case where analyzed posts exist but the timeseries is empty
 * because the rollup step was never successfully completed.
 */

import { db } from "../lib/db/client";
import { tickers } from "../lib/db/schema";
import { eq } from "drizzle-orm";
import { rollupTimeseries } from "../lib/ai/sentiment";

async function run() {
  console.log("=== FORCE ROLLUP ALL TICKERS ===\n");

  const activeTickers = await db.query.tickers.findMany({
    where: eq(tickers.isActive, true),
  });

  for (const ticker of activeTickers) {
    console.log(`\n--- ${ticker.symbol} ---`);
    try {
      await rollupTimeseries(ticker);
    } catch (e) {
      console.error(`  ❌ Rollup failed for ${ticker.symbol}:`, e);
    }
  }

  console.log("\n=== DONE ===");
  process.exit(0);
}

run().catch(e => {
  console.error("Fatal:", e);
  process.exit(1);
});
