/**
 * setup-cron-jobs.ts
 * Run: npx tsx --env-file=.env scripts/setup-cron-jobs.ts
 *
 * Creates or updates cron jobs on cron-job.org via their REST API.
 * Replaces the Vercel cron functionality previously defined in vercel.json.
 *
 * Two jobs are managed:
 *   - scrape-flash:  every 30 minutes  → POST /api/cron/scrape-flash
 *   - scrape-reddit: every 6 hours     → POST /api/cron/scrape-reddit
 *
 * Prerequisites:
 *   1. Create an account at https://cron-job.org
 *   2. Generate an API key in Settings → API Keys
 *   3. Set CRON_JOB_ORG_API_KEY in .env
 *   4. Set NEXT_PUBLIC_APP_URL to your deployed app URL
 */

const API_BASE = "https://api.cron-job.org";
const API_KEY = process.env.CRON_JOB_ORG_API_KEY;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL;
const CRON_SECRET = process.env.CRON_SECRET;

interface CronJobPayload {
  job: {
    url: string;
    title: string;
    enabled: boolean;
    saveResponses: boolean;
    requestMethod: "POST";
    schedule: {
      timezone: string;
      hours: number[];
      minutes: number[];
      mdays: number[];
      months: number[];
      wdays: number[];
    };
    headers?: Record<string, string>;
  };
}

const JOBS: { title: string; path: string; schedule: { minutes: number[]; hours: number[] } }[] = [
  {
    title: "crypto-mood scrape-flash",
    path: "/api/cron/scrape-flash",
    schedule: { minutes: [0, 30], hours: [-1] },
  },
  {
    title: "crypto-mood scrape-reddit",
    path: "/api/cron/scrape-reddit",
    schedule: { minutes: [0], hours: [0, 6, 12, 18] },
  },
];

async function createJob(payload: CronJobPayload): Promise<number> {
  const res = await fetch(`${API_BASE}/jobs`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create job: ${res.status} ${res.statusText} — ${text}`);
  }

  const data = (await res.json()) as { jobId: number };
  return data.jobId;
}

async function run() {
  console.log("=== SETUP CRON-JOB.ORG JOBS ===\n");

  if (!API_KEY) {
    console.error("❌ CRON_JOB_ORG_API_KEY is not set in environment");
    process.exit(1);
  }
  if (!APP_URL) {
    console.error("❌ NEXT_PUBLIC_APP_URL is not set in environment");
    process.exit(1);
  }
  if (!CRON_SECRET) {
    console.error("❌ CRON_SECRET is not set in environment");
    process.exit(1);
  }

  for (const job of JOBS) {
    const url = `${APP_URL.replace(/\/$/, "")}${job.path}`;
    console.log(`Creating: ${job.title}`);
    console.log(`  URL:     ${url}`);

    const payload: CronJobPayload = {
      job: {
        url,
        title: job.title,
        enabled: true,
        saveResponses: false,
        requestMethod: "POST",
        schedule: {
          timezone: "UTC",
          hours: job.schedule.hours,
          minutes: job.schedule.minutes,
          mdays: [-1],
          months: [-1],
          wdays: [-1],
        },
        headers: {
          Authorization: `Bearer ${CRON_SECRET}`,
        },
      },
    };

    try {
      const jobId = await createJob(payload);
      console.log(`  ✅ Created — Job ID: ${jobId}`);
    } catch (e) {
      console.error(`  ❌ Failed:`, e);
    }

    console.log();
  }

  console.log("=== DONE ===");
  process.exit(0);
}

run().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
