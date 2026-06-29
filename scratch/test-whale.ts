import "dotenv/config";
import { db } from "../lib/db/client";
import { tickers } from "../lib/db/schema";
import { scrapeWhaleData } from "../lib/scrapers/whale-tracker";

async function run() {
  const activeTickers = await db.query.tickers.findMany();
  for (const ticker of activeTickers) {
    console.log(`\n================= TESTING ${ticker.symbol} =================`);
    const result = await scrapeWhaleData(ticker, { force: true });
    if (result) {
      console.log(`Net Flow USD: $${result.netFlowUsd.toLocaleString()}`);
      console.log(`Whale Score: ${result.score}`);
      console.log(`Transactions count: ${result.transactions.length}`);
      console.log("Recent Transactions:", result.transactions.slice(0, 3).map(tx => ({
        timestamp: tx.timestamp,
        type: tx.type,
        amount: tx.amount,
        amountUsd: tx.amountUsd
      })));
    } else {
      console.log("Failed to scrape whale data.");
    }
  }
}

run().catch(console.error);
