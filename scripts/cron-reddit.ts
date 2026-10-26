/**
 * cron-reddit.ts
 * Run: npx tsx --env-file=.env scripts/cron-reddit.ts
 *
 * Scheduled every 6 hours by .github/workflows/ingest.yml. Runs the historical
 * Reddit job directly against Neon (no Worker involved).
 */

import { runRedditJob } from "@/lib/jobs/reddit";

const startedAt = Date.now();

runRedditJob()
  .then((results) => {
    console.log(JSON.stringify({ success: true, durationMs: Date.now() - startedAt, results }, null, 2));
    process.exit(0);
  })
  .catch((e) => {
    console.error("[RedditCron] Fatal:", e);
    process.exit(1);
  });
