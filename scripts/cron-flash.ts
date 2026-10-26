/**
 * cron-flash.ts
 * Run: npx tsx --env-file=.env scripts/cron-flash.ts [--force]
 *
 * Scheduled hourly by .github/workflows/ingest.yml. Runs the flash layer job
 * directly against Neon (no Worker involved).
 */

import { runFlashJob } from "@/lib/jobs/flash";

const startedAt = Date.now();

runFlashJob({ force: process.argv.includes("--force") })
  .then((results) => {
    console.log(JSON.stringify({ success: true, durationMs: Date.now() - startedAt, results }, null, 2));
    process.exit(0);
  })
  .catch((e) => {
    console.error("[FlashCron] Fatal:", e);
    process.exit(1);
  });
