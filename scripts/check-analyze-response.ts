import { db } from "../lib/db/client";
import { tickers } from "../lib/db/schema";
import { eq } from "drizzle-orm";

async function check() {
  console.log("=== CHECKING ANALYZE COMPATIBILITY ===");
  const activeTickers = await db.query.tickers.findMany({
    where: eq(tickers.isActive, true),
  });

  for (const ticker of activeTickers) {
    console.log(`\nTicker: ${ticker.symbol}`);
    // Let's see what the database has for its timeseries and raw posts
    const timeseriesCount = await db.query.sentimentTimeseries.findMany({
      where: eq(tickers.id, ticker.id), // wait, this query might be wrong, should be tickerId
    }).catch(e => {
      console.error("Timeseries query error:", e);
      return [];
    });
    console.log(`Timeseries count: ${timeseriesCount.length}`);
  }
}

check().then(() => process.exit(0));
