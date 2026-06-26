import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { tickers, sentimentTimeseries, sentimentRecords, rawPosts } from "@/lib/db/schema";
import { eq, and, asc, desc, gte, lte } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const symbol = searchParams.get("symbol")?.toUpperCase() ?? "BTC";
    
    let startDateParam = searchParams.get("startDate");
    let endDateParam = searchParams.get("endDate");

    const activeTickers = await db.query.tickers.findMany({
      where: eq(tickers.isActive, true),
    });

    const targetTicker = activeTickers.find((t) => t.symbol === symbol);
    if (!targetTicker) {
      return NextResponse.json({ error: `Ticker ${symbol} not active or not found` }, { status: 404 });
    }

    let startDate: Date;
    let endDate: Date;

    if (startDateParam && endDateParam) {
      startDate = new Date(startDateParam);
      endDate = new Date(endDateParam);
    } else {
      // Find the latest timeseries bucket start time in the database for this ticker
      const latestBucket = await db
        .select({ bucketStart: sentimentTimeseries.bucketStart })
        .from(sentimentTimeseries)
        .where(eq(sentimentTimeseries.tickerId, targetTicker.id))
        .orderBy(desc(sentimentTimeseries.bucketStart))
        .limit(1);

      if (latestBucket.length > 0) {
        endDate = latestBucket[0].bucketStart;
        startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
      } else {
        // Fallback to recent 24h of Date.now
        endDate = new Date();
        startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
      }
    }

    // Query Timeseries hourly entries
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
          gte(sentimentTimeseries.bucketStart, startDate),
          lte(sentimentTimeseries.bucketStart, endDate)
        )
      )
      .orderBy(asc(sentimentTimeseries.bucketStart));

    // Query granular posts and sentiment reasonings in the window
    const postsData = await db
      .select({
        id: sentimentRecords.id,
        score: sentimentRecords.score,
        reasoning: sentimentRecords.reasoning,
        title: rawPosts.title,
        postedAt: rawPosts.postedAt,
        upvotes: rawPosts.upvotes,
      })
      .from(sentimentRecords)
      .innerJoin(rawPosts, eq(sentimentRecords.postId, rawPosts.id))
      .where(
        and(
          eq(sentimentRecords.tickerId, targetTicker.id),
          gte(rawPosts.postedAt, startDate),
          lte(rawPosts.postedAt, endDate)
        )
      )
      .orderBy(desc(rawPosts.upvotes));

    // Associate posts to hourly timeseries buckets
    const logs = timeseriesData.map((t) => {
      const bucketHour = t.bucketStart.getHours();
      const bucketDay = t.bucketStart.getDate();

      // Find matching posts in same hour slot
      const matchingPosts = postsData.filter((p) => {
        const pDate = new Date(p.postedAt);
        return pDate.getHours() === bucketHour && pDate.getDate() === bucketDay;
      });

      const topPost = matchingPosts[0]; // Sort ordered by upvotes desc

      const formattedHour = t.bucketStart.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      return {
        h: formattedHour,
        title: topPost ? topPost.title : "Ingestion timeline check: baseline stable",
        score: Math.round(parseFloat(t.score ?? "0") * 100),
        label: t.score ? (parseFloat(t.score) > 0.15 ? "bullish" : parseFloat(t.score) < -0.15 ? "bearish" : "neutral") : "neutral",
        reason: topPost ? topPost.reasoning : "Sentiment engine metrics steady. No significant retail or whale spikes logged.",
        spotPrice: t.spotPrice ? parseFloat(t.spotPrice) : null,
      };
    });

    return NextResponse.json({
      name: `Real-Time Ingestion: ${symbol}`,
      date: startDate.toLocaleDateString([], { month: "short", day: "2-digit", year: "numeric" }),
      startScore: logs.length > 0 ? logs[0].score : 0,
      endScore: logs.length > 0 ? logs[logs.length - 1].score : 0,
      logs,
    });
  } catch (error: any) {
    console.error("[Playback API] Failed to assemble timeline logs:", error);
    return NextResponse.json(
      { error: "Failed to assemble historical playback timeline", details: error.message },
      { status: 500 }
    );
  }
}
