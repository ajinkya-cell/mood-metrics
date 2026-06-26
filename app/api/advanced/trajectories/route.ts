import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { tickers, sentimentRecords, rawPosts } from "@/lib/db/schema";
import { eq, and, desc, gte } from "drizzle-orm";

function parseVector(val: any): number[] {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch {
      return val.replace(/[\[\]]/g, "").split(",").map(Number);
    }
  }
  return [];
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

function averageVectors(a: number[], b: number[]): number[] {
  if (a.length !== b.length) return a;
  const avg = new Array(a.length);
  for (let i = 0; i < a.length; i++) {
    avg[i] = (a[i] + b[i]) / 2;
  }
  return avg;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const symbol = searchParams.get("symbol")?.toUpperCase() ?? "BTC";
    const timeframe = searchParams.get("timeframe") ?? "7d"; // 7d, 30d

    const activeTickers = await db.query.tickers.findMany({
      where: eq(tickers.isActive, true),
    });

    const targetTicker = activeTickers.find((t) => t.symbol === symbol);
    if (!targetTicker) {
      return NextResponse.json({ error: `Ticker ${symbol} not active or not found` }, { status: 404 });
    }

    let cutoffDays = 7;
    if (timeframe === "30d") cutoffDays = 30;

    const cutoffDate = new Date(Date.now() - cutoffDays * 24 * 60 * 60 * 1000);

    // Retrieve sentiment records with vector embeddings
    const records = await db
      .select({
        id: sentimentRecords.id,
        label: sentimentRecords.label,
        score: sentimentRecords.score,
        reasoning: sentimentRecords.reasoning,
        analyzedAt: sentimentRecords.analyzedAt,
        embedding: sentimentRecords.embedding,
        postTitle: rawPosts.title,
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
      .orderBy(desc(sentimentRecords.analyzedAt));

    // Group records by day
    const dayGroups: { [key: string]: typeof records } = {};
    records.forEach((rec) => {
      if (!rec.embedding) return;
      const dateStr = new Date(rec.postedAt).toISOString().split("T")[0]; // YYYY-MM-DD
      if (!dayGroups[dateStr]) {
        dayGroups[dateStr] = [];
      }
      dayGroups[dateStr].push(rec);
    });

    // Sort days chronologically
    const sortedDays = Object.keys(dayGroups).sort();

    // Perform leader clustering day-by-day
    interface Cluster {
      id: string;
      name: string;
      score: number;
      volume: number;
      headlines: string[];
      reasons: string[];
      centroid: number[];
      recordsList?: any[];
    }

    const lanes: {
      day: string;
      clusters: Cluster[];
    }[] = [];

    const similarityThreshold = 0.78; // Cosine clustering threshold

    sortedDays.forEach((dayStr) => {
      const dayRecords = dayGroups[dayStr];
      const clusters: Cluster[] = [];

      dayRecords.forEach((rec) => {
        const parsedEmbedding = parseVector(rec.embedding);
        if (parsedEmbedding.length === 0) return;

        let bestCluster: Cluster | null = null;
        let maxSimilarity = -1;

        for (const c of clusters) {
          const sim = cosineSimilarity(parsedEmbedding, c.centroid);
          if (sim > maxSimilarity) {
            maxSimilarity = sim;
            bestCluster = c;
          }
        }

        if (maxSimilarity >= similarityThreshold && bestCluster) {
          // Add to existing cluster
          bestCluster.recordsList = bestCluster.recordsList || [];
          bestCluster.recordsList.push(rec);
          
          bestCluster.centroid = averageVectors(bestCluster.centroid, parsedEmbedding);
          bestCluster.volume += 1;
          bestCluster.score += parseFloat(rec.score);
          if (bestCluster.headlines.length < 3 && rec.postTitle) {
            bestCluster.headlines.push(rec.postTitle);
          }
          if (bestCluster.reasons.length < 2 && rec.reasoning) {
            bestCluster.reasons.push(rec.reasoning);
          }
        } else {
          // Create new cluster
          const newClusterIdx = clusters.length;
          const clusterId = `c-${dayStr}-${newClusterIdx}`;
          clusters.push({
            id: clusterId,
            name: rec.postTitle ? rec.postTitle.slice(0, 35) + "..." : "General chatter",
            score: parseFloat(rec.score),
            volume: 1,
            headlines: rec.postTitle ? [rec.postTitle] : [],
            reasons: rec.reasoning ? [rec.reasoning] : [],
            centroid: parsedEmbedding,
            recordsList: [rec],
          });
        }
      });

      // Normalize scores & names
      clusters.forEach((c) => {
        c.score = Math.round((c.score / c.volume) * 100);
        // Find most representative headline (first headline or most descriptive)
        if (c.headlines.length > 0) {
          c.name = c.headlines[0].slice(0, 40) + (c.headlines[0].length > 40 ? "..." : "");
        }
      });

      lanes.push({
        day: new Date(dayStr).toLocaleDateString([], { month: "short", day: "2-digit" }),
        clusters,
      });
    });

    // Form chronological filaments (links) between centroids of adjacent lanes
    const links: {
      source: string;
      target: string;
      similarity: number;
    }[] = [];

    for (let l = 0; l < lanes.length - 1; l++) {
      const sourceLane = lanes[l];
      const targetLane = lanes[l + 1];

      sourceLane.clusters.forEach((sourceCluster) => {
        targetLane.clusters.forEach((targetCluster) => {
          const sim = cosineSimilarity(sourceCluster.centroid, targetCluster.centroid);
          if (sim > 0.81) {
            links.push({
              source: sourceCluster.id,
              target: targetCluster.id,
              similarity: Math.round(sim * 100) / 100,
            });
          }
        });
      });
    }

    // Clean centroids from payload before sending to client to keep it light
    lanes.forEach((lane) => {
      lane.clusters.forEach((c) => {
        delete (c as any).centroid;
        delete (c as any).recordsList;
      });
    });

    return NextResponse.json({
      lanes,
      links,
      ticker: targetTicker.symbol,
    });
  } catch (error: any) {
    console.error("[Trajectories API] Failed to calculate filaments:", error);
    return NextResponse.json(
      { error: "Failed to compile narrative trajectories", details: error.message },
      { status: 500 }
    );
  }
}
