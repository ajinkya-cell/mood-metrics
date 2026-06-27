import { db } from "../lib/db/client";
import { tickers, sentimentRecords } from "../lib/db/schema";
import { eq, sql } from "drizzle-orm";

async function run() {
  const tList = await db.select().from(tickers);
  for (const t of tList) {
    const records = await db
      .select({ count: sql<number>`count(*)` })
      .from(sentimentRecords)
      .where(eq(sentimentRecords.tickerId, t.id));
    console.log(`Symbol: ${t.symbol}, Count: ${records[0].count}`);
  }
}
run();
