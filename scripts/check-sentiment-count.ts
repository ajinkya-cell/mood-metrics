import { db } from "../lib/db/client";
import { sentimentRecords, rawPosts } from "../lib/db/schema";
import { sql, desc } from "drizzle-orm";

async function check() {
  const [totalCount] = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(sentimentRecords);

  console.log(`Current sentiment records in DB: ${totalCount.count}`);

  const recent = await db
    .select({
      id: sentimentRecords.id,
      label: sentimentRecords.label,
      score: sentimentRecords.score,
      analyzedAt: sentimentRecords.analyzedAt,
      reasoning: sentimentRecords.reasoning,
      postTitle: rawPosts.title,
    })
    .from(sentimentRecords)
    .innerJoin(rawPosts, eq(sentimentRecords.postId, rawPosts.id))
    .orderBy(desc(sentimentRecords.analyzedAt))
    .limit(5);

  console.log("\nRecent 5 analyzed records:");
  recent.forEach((r) => {
    console.log(`- [${r.analyzedAt.toISOString()}] [${r.label} | ${r.score}] "${r.postTitle?.slice(0, 50)}" -> ${r.reasoning?.slice(0, 70)}`);
  });
}

import { eq } from "drizzle-orm";

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
