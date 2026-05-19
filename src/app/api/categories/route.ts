import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { categories, faqs } from "@/db/schema";
import { asc, eq, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const cats = await db
      .select()
      .from(categories)
      .orderBy(asc(categories.sortOrder));

    // Get FAQ count for each category
    const catsWithCount = await Promise.all(
      cats.map(async (cat) => {
        const countResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(faqs)
          .where(eq(faqs.categoryId, cat.id));
        return {
          ...cat,
          faqCount: Number(countResult[0]?.count || 0),
        };
      })
    );

    return NextResponse.json({ categories: catsWithCount });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { nameZh, nameEn, sortOrder } = await request.json();
    const result = await db
      .insert(categories)
      .values({ nameZh, nameEn, sortOrder: sortOrder || 0 })
      .returning();

    return NextResponse.json({ category: result[0] });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
