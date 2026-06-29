import "dotenv/config";
import { db } from "../lib/db/client";
import { marketIndicators, tickers } from "../lib/db/schema";

async function run() {
  console.log("Fetching tickers...");
  const tList = await db.query.tickers.findMany();
  console.log("Tickers in DB:", tList.map(t => ({ id: t.id, symbol: t.symbol, name: t.name })));

  console.log("\nFetching latest market indicators...");
  const indicators = await db.query.marketIndicators.findMany();
  console.log("Indicators in DB count:", indicators.length);
  for (const ind of indicators) {
    console.log({
      id: ind.id,
      tickerId: ind.tickerId,
      indicatorType: ind.indicatorType,
      value: ind.value,
      label: ind.label,
      collectedAt: ind.collectedAt,
      metadata: ind.metadata
    });
  }
}

run().catch(console.error);
