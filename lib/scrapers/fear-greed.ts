import { db } from "@/lib/db/client";
import { marketIndicators } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";

const FETCH_TIMEOUT_MS = 8_000;
const BASE_URL = "https://api.alternative.me/fng/";

export type FearGreedResult = {
  value: number;
  score: number;
  label: string;
  classification: string;
  timestamp: Date;
};

export async function scrapeFearGreed(): Promise<FearGreedResult | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(`${BASE_URL}?limit=1`, {
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      throw new Error(`Fear & Greed API returned ${res.status}`);
    }

    const json = await res.json();
    const data = json.data?.[0];
    if (!data || typeof data.value === "undefined") {
      console.warn("[FearGreed] No data in response");
      return null;
    }

    const value = parseFloat(data.value);
    if (isNaN(value)) {
      console.warn("[FearGreed] Invalid value:", data.value);
      return null;
    }

    const label = (data.value_classification ?? "neutral").toLowerCase();
    const timestamp = data.timestamp
      ? new Date(parseInt(data.timestamp) * 1000)
      : new Date();
    const score = parseFloat(((value - 50) / 50).toFixed(3));

    const result: FearGreedResult = {
      value,
      score,
      label,
      classification: label.replace(" ", "_"),
      timestamp,
    };

    // Store to DB
    // Upsert: there should be exactly one fear_greed row (null tickerId)
    const existing = await db.query.marketIndicators.findFirst({
      where: and(
        isNull(marketIndicators.tickerId),
        eq(marketIndicators.indicatorType, "fear_greed"),
      ),
    });

    const insertData = {
      tickerId: null,
      indicatorType: "fear_greed" as const,
      value: value.toFixed(2),
      label,
      collectedAt: timestamp,
      metadata: { score },
    };

    if (existing) {
      await db
        .update(marketIndicators)
        .set(insertData)
        .where(eq(marketIndicators.id, existing.id));
    } else {
      await db.insert(marketIndicators).values(insertData);
    }

    console.log(`[FearGreed] value=${value} label=${label} score=${score}`);
    return result;
  } catch (error) {
    clearTimeout(timer);
    const msg = error instanceof Error ? error.message : "Unknown";
    console.error("[FearGreed] Error:", msg);
    return null;
  }
}
