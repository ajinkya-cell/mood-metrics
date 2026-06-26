import { db } from "../lib/db/client";
import { tickers, sentimentTimeseries } from "../lib/db/schema";
import { eq, and, asc, gte } from "drizzle-orm";

async function test(symbol: string) {
  const targetTicker = await db.query.tickers.findFirst({
    where: eq(tickers.symbol, symbol),
  });
  if (!targetTicker) {
    console.log(`No ticker found for ${symbol}`);
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

  const validPts = timeseriesData
    .filter((pt) => pt.spotPrice !== null && parseFloat(pt.spotPrice) > 0)
    .map((pt) => ({
      time: pt.bucketStart,
      score: Math.round(parseFloat(pt.score ?? "0") * 100),
      spotPrice: parseFloat(pt.spotPrice!),
    }));

  console.log(`\n=== Asset: ${symbol} (points: ${validPts.length}) ===`);
  const scores = validPts.map(pt => pt.score);
  if (scores.length === 0) {
    console.log("No valid points found");
    return;
  }
  console.log("Min Score:", Math.min(...scores), "Max Score:", Math.max(...scores));
  
  // Test different thresholds
  for (const entry of [30, 20, 10, 5, 0, -5, -10]) {
    const exit = -10;
    let inTrade = false;
    let tradesCount = 0;
    validPts.forEach((pt) => {
      if (!inTrade && pt.score >= entry) {
        inTrade = true;
        tradesCount++;
      } else if (inTrade && pt.score <= exit) {
        inTrade = false;
      }
    });
    console.log(`Entry: ${entry}, Exit: ${exit} => Trades executed: ${tradesCount}`);
  }
}

async function run() {
  await test("BTC");
  await test("ETH");
  await test("SOL");
}

run().then(() => process.exit(0));
