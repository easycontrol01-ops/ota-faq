import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { faqs, faqTags, tags, categories, faqVersions } from "@/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const faqId = parseInt(id);

    const result = await db.select().from(faqs).where(eq(faqs.id, faqId)).limit(1);
    const faq = result[0];
    if (!faq) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const user = await getCurrentUser();
    if (faq.visibility === "internal" && !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    if (faq.status !== "published" && (!user || user.role !== "admin")) {
      if (!user) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
    }

    // Increment view count
    await db
      .update(faqs)
      .set({ viewCount: sql`${faqs.viewCount} + 1` })
      .where(eq(faqs.id, faqId));

    // Get tags
    const faqTagList = await db
      .select({ tag: tags })
      .from(faqTags)
      .innerJoin(tags, eq(faqTags.tagId, tags.id))
      .where(eq(faqTags.faqId, faqId));

    // Get category
    let category = null;
    if (faq.categoryId) {
      const catResult = await db
        .select()
        .from(categories)
        .where(eq(categories.id, faq.categoryId))
        .limit(1);
      category = catResult[0] || null;
    }

    // Get related FAQs (same category)
    let relatedFaqs: (typeof faq)[] = [];
    if (faq.categoryId) {
      relatedFaqs = await db
        .select()
        .from(faqs)
        .where(
          eq(faqs.categoryId, faq.categoryId)
        )
        .limit(5);
      relatedFaqs = relatedFaqs.filter((f) => f.id !== faqId && f.status === "published");
    }

    return NextResponse.json({
      faq: {
        ...faq,
        viewCount: faq.viewCount + 1,
        tags: faqTagList.map((ft) => ft.tag),
        category,
        relatedFaqs,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const faqId = parseInt(id);
    const body = await request.json();
    const {
      titleZh,
      titleEn,
      contentZh,
      contentEn,
      type,
      os,
      visibility,
      status,
      categoryId,
      tagIds,
      changeNote,
    } = body;

    const existing = await db.select().from(faqs).where(eq(faqs.id, faqId)).limit(1);
    if (!existing[0]) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      updatedBy: user.id,
      updatedAt: new Date(),
    };

    if (titleZh !== undefined) updateData.titleZh = titleZh;
    if (titleEn !== undefined) updateData.titleEn = titleEn;
    if (contentZh !== undefined) updateData.contentZh = contentZh;
    if (contentEn !== undefined) updateData.contentEn = contentEn;
    if (type !== undefined) updateData.type = type;
    if (os !== undefined) updateData.os = os;
    if (visibility !== undefined) updateData.visibility = visibility;
    if (status !== undefined) {
      updateData.status = status;
      if (status === "published" && existing[0].status !== "published") {
        updateData.publishedAt = new Date();
      }
    }
    if (categoryId !== undefined) updateData.categoryId = categoryId ? parseInt(categoryId) : null;

    await db.update(faqs).set(updateData).where(eq(faqs.id, faqId));

    // Update tags
    if (tagIds !== undefined) {
      await db.delete(faqTags).where(eq(faqTags.faqId, faqId));
      if (tagIds.length > 0) {
        await db.insert(faqTags).values(
          tagIds.map((tid: number) => ({
            faqId: faqId,
            tagId: tid,
          }))
        );
      }
    }

    // Create version record
    const latestVersion = await db
      .select()
      .from(faqVersions)
      .where(eq(faqVersions.faqId, faqId))
      .orderBy(desc(faqVersions.versionNumber))
      .limit(1);

    const nextVersion = (latestVersion[0]?.versionNumber || 0) + 1;

    await db.insert(faqVersions).values({
      faqId: faqId,
      titleZh: titleZh || existing[0].titleZh,
      titleEn: titleEn || existing[0].titleEn,
      contentZh: contentZh || existing[0].contentZh,
      contentEn: contentEn || existing[0].contentEn,
      changeNote: changeNote || "",
      modifiedBy: user.id,
      versionNumber: nextVersion,
    });

    const updated = await db.select().from(faqs).where(eq(faqs.id, faqId)).limit(1);
    return NextResponse.json({ faq: updated[0] });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const faqId = parseInt(id);
    const url = request.nextUrl;
    const permanent = url.searchParams.get("permanent") === "true";

    if (permanent) {
      // Permanent delete (from recycle bin)
      await db.delete(faqs).where(eq(faqs.id, faqId));
    } else {
      // Soft delete → move to recycle bin
      await db.update(faqs).set({ status: "deleted", updatedAt: new Date() }).where(eq(faqs.id, faqId));
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
