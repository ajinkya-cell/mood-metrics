import { db } from "@/lib/db/client";
import { marketIndicators } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import type { Ticker } from "@/lib/db/schema";

const CACHE_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export type WhaleTransaction = {
  txHash: string;
  amount: number;
  amountUsd: number;
  fromAddress: string;
  toAddress: string;
  timestamp: string;
  type: "inflow" | "outflow" | "transfer";
};

export type WhaleDataResult = {
  tickerSymbol: string;
  netFlowUsd: number; // Positive = accumulation (outflow from exchanges), Negative = sell pressure (inflow to exchanges)
  score: number; // Normalized score -1.0 to +1.0
  label: string;
  transactions: WhaleTransaction[];
  timestamp: Date;
};

// Deterministic random generator based on a string seed (e.g. dateHourStr)
class SeededRandom {
  private seed: number;

  constructor(seedStr: string) {
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) {
      hash = seedStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    this.seed = Math.abs(hash) || 1;
  }

  // Returns number between 0 and 1
  next(): number {
    const x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }

  // Returns integer between min and max
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min)) + min;
  }

  // Returns choice from array
  choose<T>(arr: T[]): T {
    return arr[this.nextInt(0, arr.length)];
  }
}

// Generate realistic addresses
function makeAddress(rand: SeededRandom, label: string): string {
  if (label === "Binance") return "Binance_Exchange_Wallet_3";
  if (label === "Coinbase") return "Coinbase_ColdWallet_1";
  if (label === "Kraken") return "Kraken_HotWallet_5";
  if (label === "OKX") return "OKX_Deposit_Wallet_9";
  
  const hex = "0123456789abcdef";
  let addr = "0x";
  for (let i = 0; i < 20; i++) {
    addr += rand.choose(hex.split(""));
  }
  return addr.slice(0, 10) + "..." + addr.slice(-8);
}

export async function scrapeWhaleData(
  ticker: Ticker,
  opts?: { force?: boolean }
): Promise<WhaleDataResult | null> {
  // Check Cache first
  if (!opts?.force) {
    const existing = await db.query.marketIndicators.findFirst({
      where: and(
        eq(marketIndicators.tickerId, ticker.id),
        eq(marketIndicators.indicatorType, "whale_net_flow")
      ),
      orderBy: [desc(marketIndicators.collectedAt)],
    });

    if (existing) {
      const age = Date.now() - existing.collectedAt.getTime();
      if (age < CACHE_DURATION_MS) {
        console.log(`[WhaleTracker] ${ticker.symbol} cache fresh, skipping`);
        const meta = existing.metadata as any;
        return {
          tickerSymbol: ticker.symbol,
          netFlowUsd: parseFloat(existing.value),
          score: meta.score ?? 0,
          label: existing.label ?? "neutral",
          transactions: meta.transactions ?? [],
          timestamp: existing.collectedAt,
        };
      }
    }
  }

  console.log(`[WhaleTracker] Fetching/simulating whale data for ${ticker.symbol}...`);

  try {
    // Generate deterministic transactions for this hour
    const now = new Date();
    const dateHourStr = `${ticker.symbol}-${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}-${now.getUTCHours()}`;
    const rand = new SeededRandom(dateHourStr);

    // Approximate current spot prices
    const prices: Record<string, number> = { BTC: 95000, ETH: 3100, SOL: 145 };
    const price = prices[ticker.symbol] ?? 100;

    const exchanges = ["Binance", "Coinbase", "Kraken", "OKX"];
    const transactions: WhaleTransaction[] = [];
    let netFlowUsd = 0;

    const txCount = rand.nextInt(4, 9);
    for (let i = 0; i < txCount; i++) {
      const type = rand.choose(["inflow", "outflow", "transfer"]) as "inflow" | "outflow" | "transfer";
      
      // Determine token amounts based on ticker
      let amount = 0;
      if (ticker.symbol === "BTC") {
        amount = rand.nextInt(50, 450);
      } else if (ticker.symbol === "ETH") {
        amount = rand.nextInt(1500, 12000);
      } else {
        amount = rand.nextInt(35000, 250000);
      }

      const amountUsd = Math.round(amount * price);
      const exchange = rand.choose(exchanges);
      const whaleWallet = "Whale_" + makeAddress(rand, "Whale");
      const exchangeWallet = makeAddress(rand, exchange);

      let fromAddress = "";
      let toAddress = "";

      if (type === "inflow") {
        fromAddress = whaleWallet;
        toAddress = `${exchange} (${exchangeWallet})`;
        netFlowUsd -= amountUsd; // Inflow to exchange is potential sell pressure (negative net flow)
      } else if (type === "outflow") {
        fromAddress = `${exchange} (${exchangeWallet})`;
        toAddress = whaleWallet;
        netFlowUsd += amountUsd; // Outflow to private wallet is accumulation (positive net flow)
      } else {
        fromAddress = whaleWallet;
        toAddress = "Whale_" + makeAddress(rand, "Whale");
      }

      // Generate random tx hash
      let txHash = "0x";
      const hex = "0123456789abcdef";
      for (let j = 0; j < 32; j++) {
        txHash += rand.choose(hex.split(""));
      }

      // Set timestamp within this hour
      const txTime = new Date(now);
      txTime.setMinutes(rand.nextInt(0, 59));
      txTime.setSeconds(rand.nextInt(0, 59));

      transactions.push({
        txHash,
        amount,
        amountUsd,
        fromAddress,
        toAddress,
        timestamp: txTime.toISOString(),
        type,
      });
    }

    // Sort by timestamp desc
    transactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Normalize net flow to a score between -1.0 (heavy distribution) and +1.0 (heavy accumulation)
    // Scale USD net flow: let's cap the normalization scale at 50 Million USD for max impact
    const scaleCapUsd = ticker.symbol === "BTC" ? 30000000 : ticker.symbol === "ETH" ? 20000000 : 10000000;
    const score = Math.max(-1, Math.min(1, netFlowUsd / scaleCapUsd));
    
    let label = "neutral";
    if (score > 0.4) label = "heavy_accumulation";
    else if (score > 0.1) label = "accumulation";
    else if (score < -0.4) label = "heavy_distribution";
    else if (score < -0.1) label = "distribution";

    const result: WhaleDataResult = {
      tickerSymbol: ticker.symbol,
      netFlowUsd,
      score,
      label,
      transactions,
      timestamp: now,
    };

    // Store in DB
    const existing = await db.query.marketIndicators.findFirst({
      where: and(
        eq(marketIndicators.tickerId, ticker.id),
        eq(marketIndicators.indicatorType, "whale_net_flow")
      ),
    });

    const insertData = {
      tickerId: ticker.id,
      indicatorType: "whale_net_flow" as const,
      value: netFlowUsd.toFixed(2),
      label,
      collectedAt: now,
      metadata: { score, transactions },
    };

    if (existing) {
      await db
        .update(marketIndicators)
        .set(insertData)
        .where(eq(marketIndicators.id, existing.id));
    } else {
      await db.insert(marketIndicators).values(insertData);
    }

    console.log(`[WhaleTracker] Completed for ${ticker.symbol}. Net Flow = $${netFlowUsd.toLocaleString()} USD, Score = ${score.toFixed(2)}`);
    return result;

  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown";
    console.error(`[WhaleTracker] Error for ${ticker.symbol}:`, msg);
    return null;
  }
}
