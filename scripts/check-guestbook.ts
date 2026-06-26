import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

async function run() {
  const { db } = await import("../lib/db/client");
  const { guestbookNotes } = await import("../lib/db/schema");

  const notes = await db.select().from(guestbookNotes);
  console.log("Guestbook notes count:", notes.length);
  console.log("Notes:", JSON.stringify(notes, null, 2));
}

run().catch(console.error);
