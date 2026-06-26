import { db } from "../lib/db/client";
import { tickers, sentimentTimeseries } from "../lib/db/schema";
import { eq, and, asc, gte } from "drizzle-orm";

async function test() {
  const symbol = "SOL";
  const targetTicker = await db.query.tickers.findFirst({
    where: eq(tickers.symbol, symbol),
  });
  if (!targetTicker) {
    console.log("No ticker found");
    return;
  }
  
  const cutoffDays = 30;
  const cutoffDate = new Date(Date.now() - cutoffDays * 24 * 60 * 60 * 1000);

  const timeseriesData = await db
    .select({
      bucketStart: sentimentTimeseries.bucketStart,
      score: sentimentTimeseries.volumeWeightedScore,
      spotPrice: sentimentTimeseries.spotPrice,
    })
    .from(sentimentTimeseries)
    .where(
      and(
        eq(sentimentTimeseries.tickerId, targetTicker.id),
        eq(sentimentTimeseries.interval, "1h"),
        gte(sentimentTimeseries.bucketStart, cutoffDate)
      )
    )
    .orderBy(asc(sentimentTimeseries.bucketStart));

  console.log("Total raw timeseries rows fetched:", timeseriesData.length);

  const validPts = timeseriesData
    .filter((pt) => pt.spotPrice !== null && parseFloat(pt.spotPrice) > 0)
    .map((pt) => ({
      time: pt.bucketStart,
      score: Math.round(parseFloat(pt.score ?? "0") * 100),
      spotPrice: parseFloat(pt.spotPrice!),
    }));

  console.log("validPts length:", validPts.length);
  if (validPts.length > 0) {
    console.log("First 5 validPts:", validPts.slice(0, 5));
    console.log("Last 5 validPts:", validPts.slice(-5));
  }
}

test().then(() => process.exit(0));
