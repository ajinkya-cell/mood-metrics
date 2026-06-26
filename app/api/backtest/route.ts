import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { tickers, sentimentTimeseries } from "@/lib/db/schema";
import { eq, and, asc, gte } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const symbol = searchParams.get("symbol")?.toUpperCase() ?? "BTC";
    const strategy = searchParams.get("strategy") ?? "trend_following";
    const entryThreshold = parseInt(searchParams.get("entryThreshold") ?? "30", 10);
    const exitThreshold = parseInt(searchParams.get("exitThreshold") ?? "-10", 10);
    const initialCapital = parseInt(searchParams.get("initialCapital") ?? "10000", 10);
    const timeframe = searchParams.get("timeframe") ?? "30d";

    const activeTickers = await db.query.tickers.findMany({
      where: eq(tickers.isActive, true),
    });

    const targetTicker = activeTickers.find((t) => t.symbol === symbol);
    if (!targetTicker) {
      return NextResponse.json({ error: `Ticker ${symbol} not active or not found` }, { status: 404 });
    }

    let cutoffDays = 30;
    if (timeframe === "7d") cutoffDays = 7;
    else if (timeframe === "24h") cutoffDays = 1;

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

    if (validPts.length < 5) {
      return NextResponse.json({
        isReal: false,
        error: "Insufficient historical database telemetry to perform backtest. Fallback to client-side Monte Carlo simulation.",
      });
    }

    // Run backtest simulation
    const equityCurve: { day: number; strategy: number; benchmark: number }[] = [];
    let strategyCapital = initialCapital;
    const startPrice = validPts[0].spotPrice;
    
    let inTrade = false;
    let entryPrice = startPrice;
    let tradesCount = 0;
    let winsCount = 0;

    validPts.forEach((pt, idx) => {
      const currentSentiment = pt.score; // -100 to 100
      const currentPrice = pt.spotPrice;
      
      const benchmarkCapital = initialCapital * (currentPrice / startPrice);

      if (strategy === "trend_following") {
        if (!inTrade && currentSentiment >= entryThreshold) {
          inTrade = true;
          entryPrice = currentPrice;
          tradesCount++;
        } else if (inTrade && currentSentiment <= exitThreshold) {
          inTrade = false;
          const tradeReturn = currentPrice / entryPrice - 0.002; // Slippage + fee
          if (tradeReturn > 1.0) winsCount++;
          strategyCapital = strategyCapital * tradeReturn;
        }
      } else {
        // Contrarian strategy
        if (!inTrade && currentSentiment <= entryThreshold) {
          inTrade = true;
          entryPrice = currentPrice;
          tradesCount++;
        } else if (inTrade && currentSentiment >= exitThreshold) {
          inTrade = false;
          const tradeReturn = currentPrice / entryPrice - 0.002; // Slippage + fee
          if (tradeReturn > 1.0) winsCount++;
          strategyCapital = strategyCapital * tradeReturn;
        }
      }

      const currentStrategyValue = inTrade
        ? strategyCapital * (currentPrice / entryPrice)
        : strategyCapital;

      equityCurve.push({
        day: idx + 1,
        strategy: Math.round(currentStrategyValue),
        benchmark: Math.round(benchmarkCapital),
      });
    });

    const strategyVal = equityCurve[equityCurve.length - 1].strategy;
    const benchmarkVal = equityCurve[equityCurve.length - 1].benchmark;

    const totalReturn = ((strategyVal - initialCapital) / initialCapital) * 100;
    const benchmarkReturn = ((benchmarkVal - initialCapital) / initialCapital) * 100;
    const winRate = tradesCount > 0 ? Math.round((winsCount / tradesCount) * 100) : 0;

    // Calculate Max Drawdown
    let peak = initialCapital;
    let maxD = 0;
    equityCurve.forEach((pt) => {
      if (pt.strategy > peak) {
        peak = pt.strategy;
      }
      const dd = peak > 0 ? ((peak - pt.strategy) / peak) * 100 : 0;
      if (dd > maxD) {
        maxD = dd;
      }
    });
    const maxDrawdown = maxD;

    // Calculate Sharpe Ratio (Risk Free Rate assumed 0)
    const hourlyReturns = [];
    for (let i = 1; i < equityCurve.length; i++) {
      const prev = equityCurve[i - 1].strategy;
      const curr = equityCurve[i].strategy;
      const ret = prev > 0 ? (curr - prev) / prev : 0;
      hourlyReturns.push(ret);
    }

    let sharpeRatio = 0;
    if (hourlyReturns.length > 1) {
      const mean = hourlyReturns.reduce((sum, r) => sum + r, 0) / hourlyReturns.length;
      const variance = hourlyReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (hourlyReturns.length - 1);
      const stdDev = Math.sqrt(variance);
      if (stdDev > 0) {
        // Annualize from hourly (24 * 365 = 8760 hours in a year)
        sharpeRatio = (mean / stdDev) * Math.sqrt(24 * 365);
      }
    }

    return NextResponse.json({
      isReal: true,
      totalReturn,
      benchmarkReturn,
      sharpeRatio,
      maxDrawdown,
      tradesCount,
      winRate,
      equityCurve,
    });
  } catch (error: any) {
    console.error("[Backtest API] Error running backtest:", error);
    return NextResponse.json(
      { error: "Internal server error running backtest", details: error.message },
      { status: 500 }
    );
  }
}
