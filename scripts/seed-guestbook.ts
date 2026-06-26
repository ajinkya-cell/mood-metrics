import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

import { sql } from "drizzle-orm";

async function run() {
  console.log("Seeding guestbook database notes...");

  // Dynamically import db client after dotenv config has run to prevent ES hoisting errors
  const { db } = await import("../lib/db/client");
  const { guestbookNotes } = await import("../lib/db/schema");

  // 1. Clear existing notes to ensure clean seeding
  await db.execute(sql`TRUNCATE TABLE guestbook_notes CASCADE`);
  console.log("Cleared existing guestbook_notes records.");

  // 2. Insert records sequentially to collect IDs
  const nodes = [
    { name: "Satoshi_N", message: "Ingesting blocks, calculating cryptographic consensus. The genesis of sentiment is here.", x: 80, y: 70 },
    { name: "Vitalik_B", message: "Exploring similarity trajectories between Daily Centroids. Very aligned with Ethereum research.", x: 380, y: 80 },
    { name: "CryptoWhale", message: "Divergence between retail consensus and funding skews detected. Long position opened.", x: 230, y: 140 },
    { name: "Alpha_Seeker", message: "Backtesting strategy models with Pearson Lag. 72% win-rate on 12h interval.", x: 120, y: 220 },
    { name: "Llama_Oracle", message: "Analyzing funding rates from Binance perp index. Classification labels: BULLISH.", x: 310, y: 260 },
    { name: "Ajinkya", message: "Designed the cockpit architecture. Ingesting panic, outputting alpha.", x: 110, y: 130 },
    { name: "Antigravity Agent", message: "Pair programming in the sentiment loop. Ingestion channels normal.", x: 420, y: 180 },
    { name: "Quant Alpha", message: "Backtesting contrarian flips. Funding rate normalization is clean.", x: 280, y: 200 }
  ];

  const inserted: any[] = [];
  for (const node of nodes) {
    const [result] = await db.insert(guestbookNotes).values({
      name: node.name,
      message: node.message,
      x: node.x,
      y: node.y,
      connections: []
    }).returning();
    inserted.push(result);
  }
  console.log(`Inserted ${inserted.length} visitor nodes.`);

  // 3. Establish mutual connections using real UUIDs
  const connectionsMap: Record<number, number[]> = {
    0: [5, 2],
    1: [2, 6],
    2: [0, 1, 5, 7],
    3: [5, 7],
    4: [7, 6],
    5: [0, 2, 3],
    6: [1, 4, 7],
    7: [2, 3, 4, 6]
  };

  for (const [nodeIndexStr, connectedIndexes] of Object.entries(connectionsMap)) {
    const nodeIndex = parseInt(nodeIndexStr);
    const node = inserted[nodeIndex];
    const targetUuids = connectedIndexes.map(idx => inserted[idx].id);

    await db.update(guestbookNotes)
      .set({ connections: targetUuids })
      .where(sql`id = ${node.id}`);
  }

  console.log("Successfully connected all seeded nodes!");
}

run()
  .then(() => {
    console.log("Seeding complete!");
    process.exit(0);
  })
  .catch(err => {
    console.error("Fatal seeding error:", err);
    process.exit(1);
  });
