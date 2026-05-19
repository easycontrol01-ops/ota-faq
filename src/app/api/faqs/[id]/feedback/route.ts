import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { faqs, feedbacks } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const faqId = parseInt(id);
    const { helpful } = await request.json();

    await db.insert(feedbacks).values({
      faqId,
      helpful: !!helpful,
    });

    if (helpful) {
      await db
        .update(faqs)
        .set({ helpfulCount: sql`${faqs.helpfulCount} + 1` })
        .where(eq(faqs.id, faqId));
    } else {
      await db
        .update(faqs)
        .set({ notHelpfulCount: sql`${faqs.notHelpfulCount} + 1` })
        .where(eq(faqs.id, faqId));
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
