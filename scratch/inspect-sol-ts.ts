import { db } from "../lib/db/client";
import { tickers, sentimentTimeseries } from "../lib/db/schema";
import { eq, sql } from "drizzle-orm";

async function run() {
  const tList = await db.select().from(tickers);
  for (const t of tList) {
    const ts = await db
      .select({ count: sql<number>`count(*)` })
      .from(sentimentTimeseries)
      .where(eq(sentimentTimeseries.tickerId, t.id));
    console.log(`Symbol: ${t.symbol}, Timeseries Count: ${ts[0].count}`);
  }
}
run();
