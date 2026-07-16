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
    requestMethod: number; // 0 = GET, 1 = POST
    schedule: {
      timezone: string;
      hours: number[];
      minutes: number[];
      mdays: number[];
      months: number[];
      wdays: number[];
    };
    extendedData?: {
      headers?: Record<string, string>;
      body?: string;
    };
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

async function deleteJob(jobId: number, attempt = 1): Promise<void> {
  const res = await fetch(`${API_BASE}/jobs/${jobId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
    },
  });

  if (res.status === 429) {
    if (attempt > 3) throw new Error("Too many attempts due to rate limiting on delete");
    const retryAfter = res.headers.get("Retry-After");
    const waitMs = retryAfter ? parseInt(retryAfter) * 1000 : 5000 * attempt;
    console.warn(`[cron-job.org] Rate limited on deleteJob — waiting ${waitMs / 1000}s...`);
    await new Promise((resolve) => setTimeout(resolve, waitMs));
    return deleteJob(jobId, attempt + 1);
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to delete job ${jobId}: ${res.status} ${res.statusText} — ${text}`);
  }
}

async function listJobs(): Promise<{ jobId: number; title: string }[]> {
  const res = await fetch(`${API_BASE}/jobs`, {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to list jobs: ${res.status} ${res.statusText} — ${text}`);
  }

  const data = (await res.json()) as { jobs: { jobId: number; title: string }[] };
  return data.jobs || [];
}

async function createJob(payload: CronJobPayload, attempt = 1): Promise<number> {
  const res = await fetch(`${API_BASE}/jobs`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (res.status === 429) {
    if (attempt > 3) throw new Error("Too many attempts due to rate limiting on create");
    const retryAfter = res.headers.get("Retry-After");
    const waitMs = retryAfter ? parseInt(retryAfter) * 1000 : 5000 * attempt;
    console.warn(`[cron-job.org] Rate limited on createJob — waiting ${waitMs / 1000}s...`);
    await new Promise((resolve) => setTimeout(resolve, waitMs));
    return createJob(payload, attempt + 1);
  }

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

  try {
    console.log("Fetching existing jobs to clean up...");
    const existingJobs = await listJobs();
    const matchingJobs = existingJobs.filter((job) =>
      JOBS.some((j) => j.title === job.title)
    );

    if (matchingJobs.length > 0) {
      console.log(`Found ${matchingJobs.length} matching job(s). Deleting to avoid duplicates...`);
      for (const job of matchingJobs) {
        await deleteJob(job.jobId);
        console.log(`  🗑️ Deleted old job: "${job.title}" (ID: ${job.jobId})`);
      }
    } else {
      console.log("No existing matching jobs found.");
    }
    console.log();
  } catch (e) {
    console.warn("⚠️ Failed to clean up old jobs (will try to continue):", e);
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
        requestMethod: 1, // POST
        schedule: {
          timezone: "UTC",
          hours: job.schedule.hours,
          minutes: job.schedule.minutes,
          mdays: [-1],
          months: [-1],
          wdays: [-1],
        },
        extendedData: {
          headers: {
            Authorization: `Bearer ${CRON_SECRET}`,
          },
          body: "",
        },
      },
    };

    try {
      const jobId = await createJob(payload);
      console.log(`  ✅ Created — Job ID: ${jobId}`);
    } catch (e) {
      console.error(`  ❌ Failed to create:`, e);
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
