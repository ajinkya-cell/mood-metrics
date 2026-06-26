import { db } from "../lib/db/client";
import { tickers } from "../lib/db/schema";
import { scrapeReddit } from "../lib/scrapers/reddit";
import { analyzePendingPosts, rollupTimeseries } from "../lib/ai/sentiment";
import { eq } from "drizzle-orm";

async function run() {
  console.log("Starting manual Reddit Ingestion...");
  
  const activeTickers = await db.query.tickers.findMany({
    where: eq(tickers.isActive, true),
  });

  for (const ticker of activeTickers) {
    console.log(`\n=== Ticker: ${ticker.symbol} ===`);
    try {
      console.log(`1. Scraping Reddit posts for r/${ticker.redditName}...`);
      const scraped = await scrapeReddit(ticker);
      console.log(`-> Scraped: ${scraped} new posts`);

      console.log("2. Running AI sentiment analysis on pending posts...");
      const analyzed = await analyzePendingPosts(ticker);
      console.log(`-> Analyzed: ${analyzed} posts`);

      console.log("3. Rolling up timeseries database buckets...");
      await rollupTimeseries(ticker);
      console.log(`-> Rollup completed successfully.`);
    } catch (e) {
      console.error(`Error processing ${ticker.symbol}:`, e);
    }
  }
}

run()
  .then(() => {
    console.log("\nFinished Ingestion successfully!");
    process.exit(0);
  })
  .catch(err => {
    console.error("Fatal run error:", err);
    process.exit(1);
  });
