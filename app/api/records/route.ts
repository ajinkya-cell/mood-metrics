import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { sentimentRecords, rawPosts, tickers, sentimentTimeseries } from "@/lib/db/schema";
import { eq, and, desc, gte, ilike, or, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const symbol = searchParams.get("symbol")?.toUpperCase() ?? "ALL";
    const label = searchParams.get("label")?.toLowerCase() ?? "ALL";
    const source = searchParams.get("source")?.toLowerCase() ?? "ALL";
    const search = searchParams.get("search") ?? "";
    const timeframe = searchParams.get("timeframe") ?? "7d"; // 24h, 7d, 30d
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);
    const offset = Math.max(parseInt(searchParams.get("offset") ?? "0", 10), 0);

    // 1. Fetch active tickers to map symbol to tickerId
    const activeTickers = await db.query.tickers.findMany({
      where: eq(tickers.isActive, true),
    });

    const targetTicker = activeTickers.find((t) => t.symbol === symbol);

    // 2. Build where conditions for posts/sentiment records
    const conditions = [];

    if (symbol !== "ALL" && targetTicker) {
      conditions.push(eq(sentimentRecords.tickerId, targetTicker.id));
    }

    if (label !== "all") {
      conditions.push(eq(sentimentRecords.label, label as "bullish" | "bearish" | "neutral"));
    }

    if (source !== "all") {
      conditions.push(eq(rawPosts.sourceType, source as "reddit" | "coingecko" | "news_rss"));
    }

    if (search.trim() !== "") {
      conditions.push(
        or(
          ilike(rawPosts.title, `%${search}%`),
          ilike(rawPosts.content, `%${search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // 3. Query records with joined data
    const records = await db
      .select({
        id: sentimentRecords.id,
        label: sentimentRecords.label,
        score: sentimentRecords.score,
        confidence: sentimentRecords.confidence,
        reasoning: sentimentRecords.reasoning,
        analyzedAt: sentimentRecords.analyzedAt,
        postTitle: rawPosts.title,
        postContent: rawPosts.content,
        postUrl: rawPosts.url,
        sourceType: rawPosts.sourceType,
        postedAt: rawPosts.postedAt,
        upvotes: rawPosts.upvotes,
        tickerSymbol: tickers.symbol,
        tickerName: tickers.name,
      })
      .from(sentimentRecords)
      .innerJoin(rawPosts, eq(sentimentRecords.postId, rawPosts.id))
      .innerJoin(tickers, eq(sentimentRecords.tickerId, tickers.id))
      .where(whereClause)
      .orderBy(desc(sentimentRecords.analyzedAt))
      .limit(limit)
      .offset(offset);

    // 4. Query total count for pagination
    const [totalCountResult] = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(sentimentRecords)
      .innerJoin(rawPosts, eq(sentimentRecords.postId, rawPosts.id))
      .where(whereClause);
    const totalCount = totalCountResult?.count ?? 0;

    // 5. Query timeseries for graphs (if filtered to a specific symbol, or default to first/all)
    let timeseriesData: any[] = [];
    const tickerForTimeseries = targetTicker ?? activeTickers.find(t => t.symbol === "BTC") ?? activeTickers[0];
    
    if (tickerForTimeseries) {
      let cutoffDays = 7;
      if (timeframe === "24h") cutoffDays = 1;
      else if (timeframe === "30d") cutoffDays = 30;

      const cutoffDate = new Date(Date.now() - cutoffDays * 24 * 60 * 60 * 1000);

      timeseriesData = await db
        .select({
          time: sentimentTimeseries.bucketStart,
          score: sentimentTimeseries.volumeWeightedScore,
          posts: sentimentTimeseries.totalPosts,
          bullish: sentimentTimeseries.bullishCount,
          bearish: sentimentTimeseries.bearishCount,
          neutral: sentimentTimeseries.neutralCount,
        })
        .from(sentimentTimeseries)
        .where(
          and(
            eq(sentimentTimeseries.tickerId, tickerForTimeseries.id),
            eq(sentimentTimeseries.interval, "1h"),
            gte(sentimentTimeseries.bucketStart, cutoffDate)
          )
        )
        .orderBy(desc(sentimentTimeseries.bucketStart));
    }

    // 6. Compute aggregations for summary boxes
    const [statsResult] = await db
      .select({
        avgScore: sql<number>`cast(avg(cast(${sentimentRecords.score} as numeric)) as float)`,
        avgConfidence: sql<number>`cast(avg(cast(${sentimentRecords.confidence} as numeric)) as float)`,
        bullishCount: sql<number>`cast(sum(case when ${sentimentRecords.label} = 'bullish' then 1 else 0 end) as integer)`,
        bearishCount: sql<number>`cast(sum(case when ${sentimentRecords.label} = 'bearish' then 1 else 0 end) as integer)`,
        neutralCount: sql<number>`cast(sum(case when ${sentimentRecords.label} = 'neutral' then 1 else 0 end) as integer)`,
      })
      .from(sentimentRecords)
      .innerJoin(rawPosts, eq(sentimentRecords.postId, rawPosts.id))
      .where(whereClause);

    const stats = {
      avgScore: statsResult?.avgScore ?? 0,
      avgConfidence: statsResult?.avgConfidence ?? 0,
      bullishCount: statsResult?.bullishCount ?? 0,
      bearishCount: statsResult?.bearishCount ?? 0,
      neutralCount: statsResult?.neutralCount ?? 0,
      totalCount,
    };

    return NextResponse.json({
      records,
      stats,
      timeseries: timeseriesData.map((t) => ({
        time: t.time,
        score: Math.round(parseFloat(t.score ?? "0") * 100),
        posts: t.posts,
        bullish: t.bullish,
        bearish: t.bearish,
        neutral: t.neutral,
      })),
      tickers: activeTickers.map((t) => ({ symbol: t.symbol, name: t.name })),
      meta: {
        symbol,
        label,
        source,
        search,
        timeframe,
        limit,
        offset,
        tickerForTimeseries: tickerForTimeseries?.symbol ?? null,
      },
    });
  } catch (error: any) {
    console.error("[Records API] Failed to fetch sentiment records:", error);
    return NextResponse.json(
      { error: "Failed to fetch sentiment records", details: error.message },
      { status: 500 }
    );
  }
}
