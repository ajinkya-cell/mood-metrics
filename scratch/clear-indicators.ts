import "dotenv/config";
import { db } from "../lib/db/client";
import { marketIndicators } from "../lib/db/schema";
import { eq } from "drizzle-orm";

async function run() {
  console.log("Deleting all market indicators to force fresh scrape...");
  const count = await db.delete(marketIndicators);
  console.log("Delete complete. Indicators deleted.");
}

run().catch(console.error);
