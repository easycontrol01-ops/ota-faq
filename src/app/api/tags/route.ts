import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tags, faqTags } from "@/db/schema";
import { eq, sql, asc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const tagList = await db.select().from(tags).orderBy(asc(tags.name));

    const tagsWithCount = await Promise.all(
      tagList.map(async (tag) => {
        const countResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(faqTags)
          .where(eq(faqTags.tagId, tag.id));
        return {
          ...tag,
          usageCount: Number(countResult[0]?.count || 0),
        };
      })
    );

    return NextResponse.json({ tags: tagsWithCount });
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

    const { name } = await request.json();
    const result = await db.insert(tags).values({ name }).returning();
    return NextResponse.json({ tag: result[0] });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
