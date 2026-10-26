// POST /api/cron/scrape-reddit
// THE HISTORICAL LAYER — manual trigger. Scheduled runs happen in GitHub
// Actions (.github/workflows/ingest.yml → scripts/cron-reddit.ts) so ingestion
// doesn't depend on where the site is hosted.
// Job logic lives in lib/jobs/reddit.ts.

import { NextResponse } from "next/server";
import { runRedditJob } from "@/lib/jobs/reddit";

export const maxDuration = 300;

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();

  try {
    const results = await runRedditJob();
    return NextResponse.json({
      success: true,
      layer: "historical",
      durationMs: Date.now() - startedAt,
      results,
    });
  } catch (error) {
    console.error("[RedditCron] Fatal:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
