import { db } from "../lib/db/client";
import { tickers, rawPosts, sentimentRecords, sentimentTimeseries, scrapeCache, marketIndicators } from "../lib/db/schema";
import { sql } from "drizzle-orm";

async function inspect() {
  console.log("=== DATABASE INSPECTION ===");

  // 1. Tickers
  const tickerList = await db.select().from(tickers);
  console.log(`\n1. TICKERS (${tickerList.length} total):`);
  tickerList.forEach(t => {
    console.log(`  - [${t.symbol}] ${t.name} (ID: ${t.id}, CG: ${t.coingeckoId}, Reddit: ${t.redditName}, Active: ${t.isActive})`);
  });

  // 2. Raw Posts Count by Source
  const rawPostCounts = await db
    .select({
      sourceType: rawPosts.sourceType,
      count: sql<number>`count(*)`
    })
    .from(rawPosts)
    .groupBy(rawPosts.sourceType);
  
  console.log("\n2. RAW POSTS BY SOURCE:");
  if (rawPostCounts.length === 0) {
    console.log("  No raw posts found in database.");
  } else {
    rawPostCounts.forEach(c => {
      console.log(`  - ${c.sourceType}: ${c.count} posts`);
    });
  }

  // 3. Sentiment Records count
  const recordCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(sentimentRecords);
  console.log(`\n3. SENTIMENT RECORDS: ${recordCount[0].count} total`);

  // 4. Sentiment Timeseries count
  const tsCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(sentimentTimeseries);
  console.log(`\n4. SENTIMENT TIMESERIES BUCKETS: ${tsCount[0].count} total`);

  // 5. Scrape Cache state
  const cacheEntries = await db.select().from(scrapeCache);
  console.log(`\n5. SCRAPE CACHE (${cacheEntries.length} entries):`);
  cacheEntries.forEach(c => {
    console.log(`  - Ticker ID: ${c.tickerId}, Source: ${c.sourceType}, FetchTime: ${c.lastFetchedAt}, Posts: ${c.postCount}, Status: ${c.status}, Error: ${c.errorMessage || 'None'}`);
  });

  // 6. Market Indicators
  const indicatorCounts = await db
    .select({
      indicatorType: marketIndicators.indicatorType,
      count: sql<number>`count(*)`
    })
    .from(marketIndicators)
    .groupBy(marketIndicators.indicatorType);
  console.log("\n6. MARKET INDICATORS:");
  indicatorCounts.forEach(c => {
    console.log(`  - ${c.indicatorType}: ${c.count} entries`);
  });
}

inspect()
  .then(() => process.exit(0))
  .catch(err => {
    console.error("Inspection failed:", err);
    process.exit(1);
  });
