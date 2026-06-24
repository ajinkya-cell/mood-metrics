# Implementation Algorithm: Additional Signal Sources

> **Goal**: Add Fear & Greed Index (global market mood) and Binance Funding Rates (derivatives leverage sentiment) as new signal layers into the sentiment blend engine.
>
> **New blend**: `40% Flash + 30% Historic + 15% Funding Rates + 15% Fear & Greed`

---

## Architecture

### Before
```
                   ┌── Flash (60%) ──┐   ┌─ Historic (40%) ─┐
                   │ CoinGecko + RSS  │   │    Reddit AI     │
                   └────────┬────────┘   └────────┬─────────┘
                            └──────┬──────────────┘
                                   ▼
                          ┌────────────────┐
                          │ /api/analyze   │
                          │     60/40 blend│
                          └────────────────┘
```

### After
```
  ┌── Flash (40%) ──┐ ┌─ Historic (30%) ┐ ┌─ Funding (15%) ─┐ ┌─ F&G (15%) ─┐
  │ CoinGecko + RSS  │ │    Reddit AI    │ │ Binance Futures │ │ alternative  │
  └────────┬─────────┘ └────────┬────────┘ └────────┬────────┘ └──────┬──────┘
           └────────────────────┼────────────────────┼────────────────┘
                                ▼
                       ┌────────────────┐
                       │ /api/analyze   │
                       │  40/30/15/15   │
                       └────────────────┘
```

---

## Files to Change (8 total)

### 1. `lib/db/schema.ts` — New table

Add `market_indicators` table. Do **not** extend `source_type` enum — enum migrations in PostgreSQL require `ALTER TYPE ... ADD VALUE` which can't run in transactions and is error-prone with Neon.

```typescript
export const marketIndicators = pgTable("market_indicators", {
  id:             uuid("id").defaultRandom().primaryKey(),
  tickerId:       uuid("ticker_id")
                    .references(() => tickers.id, { onDelete: "cascade" }),
  indicatorType:  varchar("indicator_type", { length: 50 }).notNull(),
  // 'fear_greed'  → global (tickerId is null)
  // 'funding_rate' → per-ticker (tickerId is set)
  value:          numeric("value", { precision: 12, scale: 6 }).notNull(),
  label:          varchar("label", { length: 50 }),
  // 'extreme fear' | 'fear' | 'neutral' | 'greed' | 'extreme greed' (F&G)
  // 'bullish' | 'bearish' | 'neutral' (funding rate classification)
  metadata:       jsonb("metadata"),
  // Extra data: annualizedRate for funding, timestamp various sources
  collectedAt:    timestamp("collected_at").notNull(),
  createdAt:      timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("mi_ticker_type_idx").on(t.tickerId, t.indicatorType),
  index("mi_collected_at_idx").on(t.collectedAt),
]);

export type MarketIndicator = typeof marketIndicators.$inferSelect;
export type NewMarketIndicator = typeof marketIndicators.$inferInsert;
```

**Why a new table instead of storing as `raw_posts`?**
- Fear & Greed is **global** (no ticker association) — doesn't fit `raw_posts` schema which requires `tickerId`
- Funding Rates are **numeric values**, not textual posts — storing them in `raw_posts` would require AI analysis pass, wasting Nvidia NIM tokens
- Clean separation of concerns: posts vs. numeric indicators
- Extensible: can add open interest, liquidations, MVRV ratio, etc. in the future

**Run after schema change:**
```bash
npx drizzle-kit generate && npx drizzle-kit migrate
```

---

### 2. `lib/scrapers/fear-greed.ts` — New scraper

Follow `coingecko.ts` conventions exactly: retry, timeout, cache tracking, error handling.

#### Interface

```typescript
export type FearGreedResult = {
  value:     number;  // raw 0–100
  score:     number;  // normalized -1..+1
  label:     string;  // 'extreme fear' | 'fear' | 'neutral' | 'greed' | 'extreme greed'
  timestamp: Date;
  classification: string; // same as label, capitalized
};

export async function scrapeFearGreed(): Promise<FearGreedResult | null>
```

#### Implementation details

| Aspect | Detail |
|--------|--------|
| **Endpoint** | `GET https://api.alternative.me/fng/?limit=1` |
| **Auth** | None |
| **Rate limit** | Very generous — 1 call per 30min is negligible |
| **Timeout** | 8 seconds (same as CoinGecko) |
| **Retry** | None needed (simple single-value API, but follow pattern) |
| **Normalization** | `score = (value - 50) / 50` — maps 0→-1, 50→0, 100→+1 |
| **Storage** | `market_indicators` with `indicatorType = 'fear_greed'`, `tickerId = null` |
| **Cache** | Always fresh (30min cron), just update latest row in DB |

#### Full code structure

```typescript
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
    };

    if (existing) {
      await db
        .update(marketIndicators)
        .set({ ...insertData, metadata: { score } })
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
```

#### Edge cases

| Scenario | Behavior |
|----------|----------|
| API returns empty `data` array | Return null |
| `value` is missing or NaN | Log warning, return null |
| `value_classification` is missing | Default to `'neutral'` |
| `timestamp` is missing | Use current time |
| Network timeout | Catch AbortError, log warning, return null |
| DB write fails | Log error, still return the result object (caller can use it inline) |

---

### 3. `lib/scrapers/binance-funding.ts` — New scraper

#### Interface

```typescript
export type FundingRateResult = {
  symbol:         string;  // e.g. 'BTCUSDT'
  tickerSymbol:   string;  // e.g. 'BTC'
  fundingRate:    number;  // e.g. 0.000100 (0.01%)
  annualizedRate: number;  // fundingRate × 3 × 365
  timestamp:      Date;
  score:          number;  // normalized -1..+1
};

export async function scrapeBinanceFundingRate(
  ticker: Ticker
): Promise<FundingRateResult | null>
```

#### Implementation details

| Aspect | Detail |
|--------|--------|
| **Endpoint** | `GET https://fapi.binance.com/fapi/v1/fundingRate?symbol={pair}&limit=1` |
| **Auth** | None (public endpoint) |
| **Symbol map** | `{ BTC: 'BTCUSDT', ETH: 'ETHUSDT', SOL: 'SOLUSDT' }` |
| **Rate limit** | Binance public: 1200 req/min. We do 3 calls every 30min = negligible |
| **Timeout** | 8 seconds |
| **Retry** | Exponential backoff on 429, retry on 5xx (same as CoinGecko) |
| **Normalization** | `score = clamp(rate / 0.001, -1, 1)` — 0.05% → +0.5, -0.1% → -1.0 |
| **Annualized** | `rate × 3 × 365` (funding settles every 8h, 3× per day) |
| **Storage** | `market_indicators` with `indicatorType = 'funding_rate'`, `tickerId` set |
| **Cache** | Use `scrape_cache` table (same as other scrapers) with `sourceType = 'funding_rate'` |

#### Classification logic (for `label` column)

```typescript
function classifyFundingRate(rate: number): string {
  if (rate > 0.0005)  return 'high_long_cost';    // longs paying heavily = excessive bullish leverage
  if (rate > 0.0001)  return 'slightly_bullish';   // normal longs paying
  if (rate < -0.0005) return 'high_short_cost';     // shorts paying heavily = excessive bearish leverage
  if (rate < -0.0001) return 'slightly_bearish';    // normal shorts paying
  return 'neutral';                                  // near zero
}
```

#### Normalization formula (used in `sentiment.ts`)

```
score = clamp(fundingRate / 0.001, -1, 1)

Examples:
  +0.000500 (0.05%)  →  +0.50  (moderately bullish)
  +0.001000 (0.10%)  →  +1.00  (very bullish, max)
  -0.000300 (-0.03%) →  -0.30  (slightly bearish)
  -0.001000 (-0.10%) →  -1.00  (very bearish, max)
  ±0.000000          →   0.00  (neutral)
```

---

### 4. `lib/ai/sentiment.ts` — Add normalization + blend helpers

Add three pure functions (no I/O, no DB). These go at the **top** of the file (after imports).

```typescript
// ── Normalization helpers for new signal sources ──────────────────────────────

const BLEND_WEIGHTS = {
  flash:     0.40,
  historic:  0.30,
  funding:   0.15,
  fearGreed: 0.15,
} as const;

/**
 * Normalize Fear & Greed Index (0–100) to -1..+1 scale.
 *   0  (extreme fear)  → -1.0
 *   50 (neutral)        →  0.0
 *   100 (extreme greed) → +1.0
 */
export function normalizeFearGreed(value: number): number {
  return clamp((value - 50) / 50, -1, 1);
}

/**
 * Normalize Binance funding rate decimal to -1..+1 scale.
 *   +0.0010 (+0.10%) → +1.0  (bullish leverage)
 *   -0.0010 (-0.10%) → -1.0  (bearish leverage)
 *    0.0000          →  0.0  (neutral)
 *
 * Rates beyond ±0.1% are capped (extreme readings → contrarian signal).
 */
export function normalizeFundingRate(rate: number): number {
  return clamp(rate / 0.001, -1, 1);
}

type BlendInput = {
  flashScore:     number; // -1..+1 from CoinGecko + News
  historicScore:  number; // -1..+1 from Reddit timeseries
  fundingScore:   number; // -1..+1 normalized funding rate
  fearGreedScore: number; // -1..+1 normalized F&G
};

type BlendOutput = {
  score: number;     // -100..+100 (scaled for response)
  label: 'bullish' | 'bearish' | 'neutral';
  components: {
    flash:     number;
    historic:  number;
    funding:   number;
    fearGreed: number;
  };
};

/**
 * Compute the 4-layer blended sentiment score.
 */
export function calculateBlendedScore(input: BlendInput): BlendOutput {
  const rawScore =
    input.flashScore     * BLEND_WEIGHTS.flash +
    input.historicScore  * BLEND_WEIGHTS.historic +
    input.fundingScore   * BLEND_WEIGHTS.funding +
    input.fearGreedScore * BLEND_WEIGHTS.fearGreed;

  const score = Math.round(clamp(rawScore, -1, 1) * 100);
  const label: BlendOutput['label'] =
    score > 20  ? 'bullish' :
    score < -20 ? 'bearish' : 'neutral';

  return {
    score,
    label,
    components: {
      flash:     Math.round(input.flashScore * 100),
      historic:  Math.round(input.historicScore * 100),
      funding:   Math.round(input.fundingScore * 100),
      fearGreed: Math.round(input.fearGreedScore * 100),
    },
  };
}
```

---

### 5. `app/api/analyze/route.ts` — Update blend

#### Import changes

```typescript
// NEW imports:
import { scrapeFearGreed } from "@/lib/scrapers/fear-greed";
import { scrapeBinanceFundingRate } from "@/lib/scrapers/binance-funding";
import { normalizeFearGreed, normalizeFundingRate, calculateBlendedScore } from "@/lib/ai/sentiment";
import { marketIndicators } from "@/lib/db/schema";
```

#### Remove old constants

```typescript
// DELETE these:
const FLASH_WEIGHT    = 0.60;
const HISTORIC_WEIGHT = 0.40;
```

#### Updated Step 1: refresh stale sources

```typescript
// In the freshness check section, add:
if (!isFlashFresh("funding_rate"))
  flashRefreshTasks.push(scrapeBinanceFundingRate(ticker));
if (!isFlashFresh("fear_greed"))
  flashRefreshTasks.push(scrapeFearGreed()); // global, but idempotent
```

**Note**: `isFlashFresh` is currently hardcoded to check `"coingecko" | "news_rss"`. You'll need to either:
- (a) Expand the check to also accept `"funding_rate"` and `"fear_greed"` (but `source_type` enum doesn't have those values)
- (b) Use the `market_indicators` table directly to check freshness

**(b) is cleaner** — check freshness from `market_indicators`:

```typescript
// Check if the latest funding rate indicator is fresh
const latestFunding = await db.query.marketIndicators.findFirst({
  where: and(
    eq(marketIndicators.tickerId, ticker.id),
    eq(marketIndicators.indicatorType, "funding_rate"),
  ),
  orderBy: [desc(marketIndicators.collectedAt)],
});

const isFundingFresh = latestFunding &&
  latestFunding.collectedAt > flashCutoff;

// Check if the latest Fear & Greed indicator is fresh
const latestFng = await db.query.marketIndicators.findFirst({
  where: and(
    isNull(marketIndicators.tickerId),
    eq(marketIndicators.indicatorType, "fear_greed"),
  ),
  orderBy: [desc(marketIndicators.collectedAt)],
});

const isFngFresh = latestFng &&
  latestFng.collectedAt > flashCutoff;
```

#### New Step 3.5: fetch indicator scores

Insert after Step 3 (historic Reddit score) and before Step 4 (flash score):

```typescript
// ── Step 3.5: Pull Funding Rate + Fear & Greed ──────────────────────────────

// Funding rate (latest for this ticker)
const latestFunding = await db.query.marketIndicators.findFirst({
  where: and(
    eq(marketIndicators.tickerId, ticker.id),
    eq(marketIndicators.indicatorType, "funding_rate"),
  ),
  orderBy: [desc(marketIndicators.collectedAt)],
});

const rawFundingRate = latestFunding
  ? parseFloat(latestFunding.value as string)
  : 0;
const fundingScore = normalizeFundingRate(rawFundingRate);

// Fear & Greed (global, no ticker)
const latestFng = await db.query.marketIndicators.findFirst({
  where: and(
    isNull(marketIndicators.tickerId),
    eq(marketIndicators.indicatorType, "fear_greed"),
  ),
  orderBy: [desc(marketIndicators.collectedAt)],
});

const rawFng = latestFng ? parseFloat(latestFng.value as string) : 50;
const fearGreedScore = normalizeFearGreed(rawFng);
const fngLabel = latestFng?.label ?? "neutral";
```

#### Updated Step 5: the blend

```typescript
// ── Step 5: THE BLEND (4-layer) ─────────────────────────────────────────────
// 40% flash + 30% historic + 15% funding rate + 15% fear & greed

const blended = calculateBlendedScore({
  flashScore,
  historicScore,
  fundingScore,
  fearGreedScore,
});
```

#### Updated response

Add to the `sentiment` object in the response:

```typescript
sentiment: {
  // ... existing fields ...
  score: blended.score,
  label: blended.label,
  flashScore:    blended.components.flash,
  historicScore: blended.components.historic,
  fundingScore:  blended.components.funding,
  fearGreedScore: blended.components.fearGreed,
  flashWeight:   BLEND_WEIGHTS.flash,
  historicWeight: BLEND_WEIGHTS.historic,
  fundingWeight:  BLEND_WEIGHTS.funding,
  fearGreedWeight: BLEND_WEIGHTS.fearGreed,

  // Raw indicator values
  fundingRate: {
    rate:  Math.round(rawFundingRate * 100000) / 100000,
    score: Math.round(fundingScore * 100),
    label: rawFundingRate > 0.0001 ? 'bullish' :
           rawFundingRate < -0.0001 ? 'bearish' : 'neutral',
  },
  fearGreed: {
    value: rawFng,
    score: Math.round(fearGreedScore * 100),
    label: fngLabel,
  },
},
```

Update `meta.blendFormula`:

```typescript
meta: {
  blendFormula: "40% flash + 30% historic + 15% funding + 15% fear_greed",
  // ... rest unchanged
}
```

---

### 6. `app/api/cron/scrape-flash/route.ts` — Add new scrapers

#### Import additions

```typescript
import { scrapeFearGreed } from "@/lib/scrapers/fear-greed";
import { scrapeBinanceFundingRate } from "@/lib/scrapers/binance-funding";
```

#### Updated loop logic

```typescript
// Run Fear & Greed once first (global indicator — same value for all tickers)
await scrapeFearGreed();

for (const ticker of activeTickers) {
  console.log(`[FlashCron] === ${ticker.symbol} ===`);

  const [geckoCount, newsCount, fundingCount] = await Promise.allSettled([
    scrapeCoinGecko(ticker, { force }),
    scrapeNewsRSS(ticker, { force }),
    scrapeBinanceFundingRate(ticker, { force }),
  ]).then((r) =>
    r.map((result) => (result.status === "fulfilled" ? result.value : 0))
  );

  results[ticker.symbol] = {
    coingecko: geckoCount,
    news: newsCount,
    fundingRate: fundingCount !== 0 ? "ok" : "failed",
  };
}

// Add global indicator result
results._global = {
  fearGreed: "fetched",
};
```

#### Update max duration (optional)

```typescript
export const maxDuration = 90; // increased from 60 to account for 2 extra API calls
```

---

### 7. `.opencode/plans/implementation-algo.md` — This file

Tracking/documentation file for the implementation.

---

### 8. `context.md` — Update project context

```markdown
## Database Schema (6 tables + 3 enums)

[...existing...]
6. **`market_indicators`** — Numeric signal scores (Fear & Greed global, funding rates per ticker)

## Key Files

| File | Role |
|---|---|
| `lib/scrapers/fear-greed.ts` | Alternative.me Fear & Greed Index scraper |
| `lib/scrapers/binance-funding.ts` | Binance perpetual funding rate scraper |

## Architecture (Four-Layer Sentiment)

```
Flash (40%): CoinGecko + News RSS + Funding Rates
Historic (30%): Reddit + AI analyze
Funding Rates (15%): Binance futures sentiment
Fear & Greed (15%): Alternative.me market-wide index
```

## API Endpoints

[...existing...]
| GET | `/api/analyze?symbol=BTC` | None | Get 4-layer blended sentiment |
```

---

## Execution Order

```
Step 1: lib/db/schema.ts        — Add market_indicators table
Step 2: drizzle-kit generate     — Create SQL migration file
Step 3: drizzle-kit migrate      — Apply to Neon DB
Step 4: lib/scrapers/fear-greed.ts — Write scraper
Step 5: lib/scrapers/binance-funding.ts — Write scraper
Step 6: lib/ai/sentiment.ts      — Add normalization + blend helpers
Step 7: app/api/analyze/route.ts — Update blend logic
Step 8: app/api/cron/scrape-flash/route.ts — Integrate scrapers
Step 9: context.md               — Update docs
```

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| alternative.me API down | Low | Loses 15% of blend | Return fallback neutral (0), blend works on 3 layers |
| Binance API rate-limited | Very Low | Loses funding signal for 30min | Retry with backoff on 429, log warning, blend works on 3 layers |
| Funding rate = 0 for new ticker | Medium | Neutral signal (no impact) | Handled by normalizeFundingRate returning 0 |
| Migration conflicts on Neon | Low | DB state inconsistent | Run `drizzle-kit push` first in dev to validate |
| `/api/analyze` latency increase | Low | +200-400ms | All extra fetches are parallel via `Promise.allSettled` |
| `market_indicators` table bloat | Low | Unused historical rows | Add daily cleanup cron later (or ignore — at 3 indicators × 3 tickers × 48 runs/day = ~432 rows/day) |

---

## Future Extensions

Once this pattern is in place, adding new indicators is trivial:

1. Write scraper function that returns `{ value, label, timestamp }`
2. Store to `market_indicators` with a unique `indicatorType`
3. Add normalization function in `sentiment.ts`
4. Add weight constant in `BLEND_WEIGHTS` (and reduce others proportionally)
5. Add to analyze route + flash cron

Candidate next indicators:
- **Open Interest** (CoinGlass / Binance) — total open interest per ticker
- **Liquidations** (CoinGlass) — recent long/short liquidations as stress signal
- **MVRV Ratio** (Santiment) — on-chain profitability metric
- **Exchange Netflow** — BTC/ETH flowing into/out of exchanges
- **Google Trends** — search volume for crypto terms
