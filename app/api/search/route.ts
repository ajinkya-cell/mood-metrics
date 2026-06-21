// GET /api/search?q=bit
// Returns matching tickers

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { tickers } from "@/lib/db/schema";
import { eq, ilike, or } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";

  const results = await db.query.tickers.findMany({
    where: or(
      ilike(tickers.symbol, `%${q}%`),
      ilike(tickers.name, `%${q}%`)
    ),
  });

  return NextResponse.json(results);
}1