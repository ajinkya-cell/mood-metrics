// Run this once after your first migration:
// npx tsx src/lib/db/seed.ts

import { db } from "./client";
import { tickers } from "./schema";

const STARTER_COINS = [
  {
    symbol: "BTC",
    name: "Bitcoin",
    coingeckoId: "bitcoin",
    redditName: "bitcoin",
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    coingeckoId: "ethereum",
    redditName: "ethereum",
  },
  {
    symbol: "SOL",
    name: "Solana",
    coingeckoId: "solana",
    redditName: "solana",
  },
];

async function seed() {
  console.log("Seeding tickers...");
  for (const coin of STARTER_COINS) {
    await db
      .insert(tickers)
      .values(coin)
      .onConflictDoNothing(); // safe to re-run
    console.log(`  ✓ ${coin.symbol}`);
  }
  console.log("Done!");
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});