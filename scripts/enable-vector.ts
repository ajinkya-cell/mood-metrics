import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("DATABASE_URL is not set in your .env file.");
    process.exit(1);
  }

  console.log("Connecting to Neon PostgreSQL...");
  const sql = neon(dbUrl);

  console.log("Executing SQL: CREATE EXTENSION IF NOT EXISTS vector;");
  // Use template literal syntax as required by the Neon serverless driver
  await sql`CREATE EXTENSION IF NOT EXISTS vector;`;
  
  console.log("pgvector extension has been successfully enabled on your Neon database.");
}

main().catch((err) => {
  console.error("Failed to enable pgvector extension:", err);
  process.exit(1);
});
