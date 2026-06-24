import { db } from "@/lib/db/client";
import { marketIndicators } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import type { Ticker } from "@/lib/db/schema";

const FETCH_TIMEOUT_MS = 8_000;
const CACHE_DURATION_MS = 30 * 60 * 1000;
const BASE_URL = "https://fapi.binance.com/fapi/v1";

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const SYMBOL_MAP: Record<string, string> = {
  BTC: "BTCUSDT",
  ETH: "ETHUSDT",
  SOL: "SOLUSDT",
};

export type FundingRateResult = {
  symbol: string;
  tickerSymbol: string;
  fundingRate: number;
  annualizedRate: number;
  timestamp: Date;
  score: number;
  label: string;
};

function classifyFundingRate(rate: number): string {
  if (rate > 0.0005) return "high_long_cost";
  if (rate > 0.0001) return "slightly_bullish";
  if (rate < -0.0005) return "high_short_cost";
  if (rate < -0.0001) return "slightly_bearish";
  return "neutral";
}

function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}

async function binanceFetch<T>(path: string, attempt = 1): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.status === 429) {
      if (attempt > 2) throw new Error("Binance rate limit exceeded");
      const retryAfter = res.headers.get("Retry-After");
      const waitMs = retryAfter ? parseInt(retryAfter) * 1000 : 60_000;
      console.warn(`[Binance] Rate limited — waiting ${waitMs / 1000}s`);
      await sleep(waitMs);
      return binanceFetch(path, attempt + 1);
    }

    if (!res.ok) {
      throw new Error(`Binance returned ${res.status} on ${path}`);
    }

    return res.json() as Promise<T>;
  } catch (err) {
    clearTimeout(timer);
    const isTimeout = err instanceof Error && err.name === "AbortError";
    if (isTimeout) throw new Error(`Binance timeout on ${path}`);
    throw err;
  }
}

export async function scrapeBinanceFundingRate(
  ticker: Ticker,
  opts?: { force?: boolean }
): Promise<FundingRateResult | null> {
  const pair = SYMBOL_MAP[ticker.symbol];
  if (!pair) {
    console.warn(`[Binance] No symbol mapping for ticker ${ticker.symbol}`);
    return null;
  }

  // Cache check using market_indicators table directly
  if (!opts?.force) {
    const existing = await db.query.marketIndicators.findFirst({
      where: and(
        eq(marketIndicators.tickerId, ticker.id),
        eq(marketIndicators.indicatorType, "funding_rate")
      ),
      orderBy: [desc(marketIndicators.collectedAt)],
    });

    if (existing) {
      const age = Date.now() - existing.collectedAt.getTime();
      if (age < CACHE_DURATION_MS) {
        console.log(`[Binance] ${ticker.symbol} cache fresh, skipping`);
        const rawRate = parseFloat(existing.value);
        const metadata = (existing.metadata as { score?: number; annualizedRate?: number }) || {};
        return {
          symbol: pair,
          tickerSymbol: ticker.symbol,
          fundingRate: rawRate,
          annualizedRate: metadata.annualizedRate ?? (rawRate * 3 * 365),
          timestamp: existing.collectedAt,
          score: metadata.score ?? clamp(rawRate / 0.001, -1, 1),
          label: existing.label ?? classifyFundingRate(rawRate),
        };
      }
    }
  }

  console.log(`[Binance] Fetching funding rate for ${pair}...`);

  try {
    const rawData = await binanceFetch<Array<{
      symbol: string;
      fundingRate: string;
      fundingTime: number;
    }>>(`/fundingRate?symbol=${pair}&limit=1`);

    const data = rawData?.[0];
    if (!data || typeof data.fundingRate === "undefined") {
      console.warn(`[Binance] No funding rate data in response for ${pair}`);
      return null;
    }

    const rate = parseFloat(data.fundingRate);
    if (isNaN(rate)) {
      console.warn(`[Binance] Invalid funding rate for ${pair}:`, data.fundingRate);
      return null;
    }

    const timestamp = data.fundingTime
      ? new Date(data.fundingTime)
      : new Date();
    const annualizedRate = rate * 3 * 365;
    const score = parseFloat(clamp(rate / 0.001, -1, 1).toFixed(3));
    const label = classifyFundingRate(rate);

    const result: FundingRateResult = {
      symbol: pair,
      tickerSymbol: ticker.symbol,
      fundingRate: rate,
      annualizedRate,
      timestamp,
      score,
      label,
    };

    // Store in DB
    const existing = await db.query.marketIndicators.findFirst({
      where: and(
        eq(marketIndicators.tickerId, ticker.id),
        eq(marketIndicators.indicatorType, "funding_rate"),
      ),
    });

    const insertData = {
      tickerId: ticker.id,
      indicatorType: "funding_rate" as const,
      value: rate.toFixed(8),
      label,
      collectedAt: timestamp,
      metadata: { score, annualizedRate },
    };

    if (existing) {
      await db
        .update(marketIndicators)
        .set(insertData)
        .where(eq(marketIndicators.id, existing.id));
    } else {
      await db.insert(marketIndicators).values(insertData);
    }

    console.log(`[Binance] ${ticker.symbol} fundingRate=${rate.toFixed(6)} label=${label} score=${score}`);
    return result;
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown";
    console.error(`[Binance] Error for ${ticker.symbol}:`, msg);
    return null;
  }
}
