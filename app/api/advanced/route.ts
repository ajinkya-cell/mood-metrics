import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { sentimentRecords, rawPosts, tickers, sentimentTimeseries, marketIndicators } from "@/lib/db/schema";
import { eq, and, desc, gte, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const symbol = searchParams.get("symbol")?.toUpperCase() ?? "BTC";
    const timeframe = searchParams.get("timeframe") ?? "30d";

    const activeTickers = await db.query.tickers.findMany({
      where: eq(tickers.isActive, true),
    });

    const targetTicker = activeTickers.find((t) => t.symbol === symbol) ?? activeTickers[0];

    if (!targetTicker) {
      return NextResponse.json({ error: "No active tickers found" }, { status: 404 });
    }

    // Get timeseries data
    let cutoffDays = 30;
    if (timeframe === "7d") cutoffDays = 7;
    else if (timeframe === "24h") cutoffDays = 1;

    const cutoffDate = new Date(Date.now() - cutoffDays * 24 * 60 * 60 * 1000);

    const timeseriesData = await db
      .select({
        time: sentimentTimeseries.bucketStart,
        score: sentimentTimeseries.volumeWeightedScore,
        avgScore: sentimentTimeseries.avgScore,
        posts: sentimentTimeseries.totalPosts,
        bullish: sentimentTimeseries.bullishCount,
        bearish: sentimentTimeseries.bearishCount,
        neutral: sentimentTimeseries.neutralCount,
      })
      .from(sentimentTimeseries)
      .where(
        and(
          eq(sentimentTimeseries.tickerId, targetTicker.id),
          eq(sentimentTimeseries.interval, "1h"),
          gte(sentimentTimeseries.bucketStart, cutoffDate)
        )
      )
      .orderBy(desc(sentimentTimeseries.bucketStart));

    // Get market indicators (funding rate)
    const indicatorsData = await db
      .select({
        type: marketIndicators.indicatorType,
        value: marketIndicators.value,
        collectedAt: marketIndicators.collectedAt,
      })
      .from(marketIndicators)
      .where(
        and(
          eq(marketIndicators.tickerId, targetTicker.id),
          gte(marketIndicators.collectedAt, cutoffDate)
        )
      )
      .orderBy(desc(marketIndicators.collectedAt));

    // Get granular sentiment records for narratives & whale/retail splits
    const granularRecords = await db
      .select({
        id: sentimentRecords.id,
        label: sentimentRecords.label,
        score: sentimentRecords.score,
        confidence: sentimentRecords.confidence,
        reasoning: sentimentRecords.reasoning,
        analyzedAt: sentimentRecords.analyzedAt,
        postTitle: rawPosts.title,
        postContent: rawPosts.content,
        sourceType: rawPosts.sourceType,
        upvotes: rawPosts.upvotes,
        postedAt: rawPosts.postedAt,
      })
      .from(sentimentRecords)
      .innerJoin(rawPosts, eq(sentimentRecords.postId, rawPosts.id))
      .where(
        and(
          eq(sentimentRecords.tickerId, targetTicker.id),
          gte(sentimentRecords.analyzedAt, cutoffDate)
        )
      )
      .orderBy(desc(sentimentRecords.analyzedAt))
      .limit(150);

    return NextResponse.json({
      ticker: {
        symbol: targetTicker.symbol,
        name: targetTicker.name,
      },
      tickers: activeTickers.map((t) => ({ symbol: t.symbol, name: t.name })),
      timeseries: timeseriesData.map((t) => ({
        time: t.time,
        score: Math.round(parseFloat(t.score ?? "0") * 100),
        avgScore: Math.round(parseFloat(t.avgScore ?? "0") * 100),
        posts: t.posts,
        bullish: t.bullish,
        bearish: t.bearish,
        neutral: t.neutral,
      })),
      indicators: indicatorsData.map((ind) => ({
        type: ind.type,
        value: parseFloat(ind.value),
        collectedAt: ind.collectedAt,
      })),
      records: granularRecords.map((r) => ({
        id: r.id,
        label: r.label,
        score: parseFloat(r.score),
        confidence: parseFloat(r.confidence ?? "0.5"),
        reasoning: r.reasoning,
        analyzedAt: r.analyzedAt,
        title: r.postTitle,
        content: r.postContent,
        source: r.sourceType,
        upvotes: r.upvotes,
        postedAt: r.postedAt,
      })),
    });
  } catch (error: any) {
    console.error("[Advanced API] Failed to retrieve data:", error);
    return NextResponse.json(
      { error: "Failed to retrieve advanced tool data", details: error.message },
      { status: 500 }
    );
  }
}
