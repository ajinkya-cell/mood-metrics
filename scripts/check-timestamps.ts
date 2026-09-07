import { db } from "../lib/db/client";
import { rawPosts, sentimentRecords } from "../lib/db/schema";
import { desc, eq, sql } from "drizzle-orm";

async function run() {
  console.log("=== CHECKING RECENT POSTS AND TIMESTAMPS ===");
  
  // Check newest 5 posts per source
  for (const source of ["reddit", "news_rss", "coingecko"] as const) {
    console.log(`\n--- Latest 5 posts for source: ${source} ---`);
    const posts = await db
      .select({
        id: rawPosts.id,
        tickerId: rawPosts.tickerId,
        title: rawPosts.title,
        postedAt: rawPosts.postedAt,
        scrapedAt: rawPosts.scrapedAt,
        url: rawPosts.url
      })
      .from(rawPosts)
      .where(eq(rawPosts.sourceType, source))
      .orderBy(desc(rawPosts.postedAt))
      .limit(5);

    if (posts.length === 0) {
      console.log("  No posts found.");
    } else {
      posts.forEach((p) => {
        console.log(`  - [${p.postedAt.toISOString()}] (scraped: ${p.scrapedAt.toISOString()}) ${p.title?.slice(0, 70)}`);
      });
    }
  }

  // Check sentiment records
  console.log("\n--- Latest 5 sentiment records ---");
  const records = await db
    .select({
      id: sentimentRecords.id,
      label: sentimentRecords.label,
      score: sentimentRecords.score,
      analyzedAt: sentimentRecords.analyzedAt,
    })
    .from(sentimentRecords)
    .orderBy(desc(sentimentRecords.analyzedAt))
    .limit(5);

  records.forEach((r) => {
    console.log(`  - [${r.analyzedAt.toISOString()}] ${r.label} score: ${r.score}`);
  });

  // Check how many raw posts do NOT have a sentiment record yet
  const unanalyzed = await db.execute(sql`
    SELECT r.source_type, count(r.id) 
    FROM raw_posts r 
    LEFT JOIN sentiment_records s ON r.id = s.post_id 
    WHERE s.id IS NULL 
    GROUP BY r.source_type
  `);
  console.log("\n--- Unanalyzed raw posts count by source ---");
  console.log(unanalyzed.rows);
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
