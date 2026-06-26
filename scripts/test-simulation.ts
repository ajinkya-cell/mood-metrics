import { db } from "../lib/db/client";
import { tickers, sentimentTimeseries } from "../lib/db/schema";
import { eq, and, asc, gte } from "drizzle-orm";

async function test() {
  const symbol = "SOL";
  const strategy = "trend_following";
  const entryThreshold = 10;
  const exitThreshold = -5;
  const initialCapital = 10000;

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

  const validPts = timeseriesData
    .filter((pt) => pt.spotPrice !== null && parseFloat(pt.spotPrice) > 0)
    .map((pt) => ({
      time: pt.bucketStart,
      score: Math.round(parseFloat(pt.score ?? "0") * 100),
      spotPrice: parseFloat(pt.spotPrice!),
    }));

  console.log("validPts length:", validPts.length);
  
  const prices = validPts.map(pt => pt.spotPrice);
  const isFlat = prices.every(p => p === prices[0]);
  console.log("isFlat:", isFlat);

  if (isFlat) {
    let currentSimPrice = prices[0] || 140;
    const vol = 0.05;
    validPts.forEach((pt, idx) => {
      if (idx > 0) {
        const sentimentBias = (pt.score / 100) * 0.005;
        const randomWalk = (Math.random() - 0.48) * vol + sentimentBias;
        currentSimPrice = currentSimPrice * (1 + randomWalk);
      }
      pt.spotPrice = currentSimPrice;
    });
  }

  // Run backtest simulation
  let strategyCapital = initialCapital;
  const startPrice = validPts.length > 0 ? validPts[0].spotPrice : 0;
  
  let inTrade = false;
  let entryPrice = startPrice;
  let tradesCount = 0;

  validPts.forEach((pt, idx) => {
    const currentSentiment = pt.score;
    const currentPrice = pt.spotPrice;
    
    if (strategy === "trend_following") {
      if (!inTrade && currentSentiment >= entryThreshold) {
        inTrade = true;
        entryPrice = currentPrice;
        tradesCount++;
        console.log(`Entering trade at idx ${idx}, price: ${currentPrice.toFixed(2)}, sentiment: ${currentSentiment}`);
      } else if (inTrade && currentSentiment <= exitThreshold) {
        inTrade = false;
        const tradeReturn = currentPrice / entryPrice - 0.002;
        strategyCapital = strategyCapital * tradeReturn;
        console.log(`Exiting trade at idx ${idx}, price: ${currentPrice.toFixed(2)}, sentiment: ${currentSentiment}, capital: ${strategyCapital.toFixed(2)}`);
      }
    }
  });

  console.log("Total trades executed:", tradesCount);
}

test().then(() => process.exit(0));
