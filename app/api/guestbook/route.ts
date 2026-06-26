import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { guestbookNotes } from "@/lib/db/schema";
import { asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const notes = await db.query.guestbookNotes.findMany({
      orderBy: [asc(guestbookNotes.createdAt)],
    });
    return NextResponse.json(notes, {
      headers: {
        "Cache-Control": "no-store, max-age=0, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("Failed to fetch guestbook notes:", error);
    return NextResponse.json(
      { error: "Failed to fetch guestbook notes" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, message, x, y, connections } = body;

    if (!name || !message || typeof x !== "number" || typeof y !== "number") {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const [newNote] = await db
      .insert(guestbookNotes)
      .values({
        name,
        message,
        x,
        y,
        connections: connections || [],
      })
      .returning();

    return NextResponse.json(newNote);
  } catch (error: any) {
    console.error("Failed to create guestbook note:", error);
    return NextResponse.json(
      { error: "Failed to create guestbook note" },
      { status: 500 }
    );
  }
}
