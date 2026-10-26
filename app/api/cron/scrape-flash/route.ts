// POST /api/cron/scrape-flash
// THE FLASH LAYER — manual trigger. Scheduled runs happen in GitHub Actions
// (.github/workflows/ingest.yml → scripts/cron-flash.ts) so ingestion doesn't
// depend on where the site is hosted.
// Job logic lives in lib/jobs/flash.ts.

import { NextResponse } from "next/server";
import { runFlashJob } from "@/lib/jobs/flash";

export const maxDuration = 90;

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const force = searchParams.get("force") === "true";
  const startedAt = Date.now();

  try {
    const results = await runFlashJob({ force });
    return NextResponse.json({
      success: true,
      layer: "flash",
      durationMs: Date.now() - startedAt,
      results,
    });
  } catch (error) {
    console.error("[FlashCron] Fatal:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
