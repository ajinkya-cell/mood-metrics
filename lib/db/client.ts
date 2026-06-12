import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Neon uses HTTP-based connection — works perfectly in Vercel serverless
const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle(sql, { schema });

export type DB = typeof db;