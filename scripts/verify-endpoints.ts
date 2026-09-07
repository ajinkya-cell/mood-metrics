import { db } from "../lib/db/client";
import { tickers } from "../lib/db/schema";
import { scrapeNewsRSS } from "../lib/scrapers/news";
import { scrapeReddit } from "../lib/scrapers/reddit";
import { eq } from "drizzle-orm";

async function verify() {
  console.log("=== VERIFYING SCRAPERS INGESTION ===");

  const btcTicker = await db.query.tickers.findFirst({
    where: eq(tickers.symbol, "BTC"),
  });

  if (!btcTicker) throw new Error("BTC ticker not found");

  console.log("\n1. Running scrapeNewsRSS for BTC with force=true...");
  const newsCount = await scrapeNewsRSS(btcTicker, { force: true });
  console.log(`✅ scrapeNewsRSS inserted ${newsCount} articles.`);

  console.log("\n2. Running scrapeReddit for BTC...");
  const redditCount = await scrapeReddit(btcTicker);
  console.log(`✅ scrapeReddit processed: ${redditCount} new posts.`);
}

verify()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Verification failed:", e);
    process.exit(1);
  });
