import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { faqs, faqTags, tags, categories, faqVersions, searchLogs } from "@/db/schema";
import { eq, ne, desc, ilike, or, and, sql, asc, inArray } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl;
    const search = url.searchParams.get("search") || "";
    const categoryId = url.searchParams.get("categoryId");
    const type = url.searchParams.get("type");
    const os = url.searchParams.get("os");
    const tagId = url.searchParams.get("tagId");
    const status = url.searchParams.get("status");
    const visibility = url.searchParams.get("visibility");
    const sort = url.searchParams.get("sort") || "newest";
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    const user = await getCurrentUser();
    const isInternal = !!user;

    const conditions = [];

    // Visibility filter
    if (!isInternal) {
      conditions.push(eq(faqs.visibility, "public"));
      conditions.push(eq(faqs.status, "published"));
    } else if (visibility) {
      conditions.push(eq(faqs.visibility, visibility as "public" | "internal"));
    }

    if (status && isInternal) {
      if (status === "deleted") {
        conditions.push(eq(faqs.status, "deleted"));
      } else {
        conditions.push(eq(faqs.status, status as "draft" | "pending" | "published" | "offline" | "archived"));
      }
    } else if (!isInternal) {
      conditions.push(eq(faqs.status, "published"));
    }

    // Exclude deleted by default unless explicitly requesting deleted
    if (!status || status !== "deleted") {
      conditions.push(ne(faqs.status, "deleted"));
    }

    if (search) {
      conditions.push(
        or(
          ilike(faqs.titleZh, `%${search}%`),
          ilike(faqs.titleEn, `%${search}%`),
          ilike(faqs.contentZh, `%${search}%`),
          ilike(faqs.contentEn, `%${search}%`)
        )!
      );
      // Log search
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(faqs)
        .where(
          and(
            or(
              ilike(faqs.titleZh, `%${search}%`),
              ilike(faqs.titleEn, `%${search}%`)
            ),
            eq(faqs.status, "published")
          )
        );
      await db.insert(searchLogs).values({
        keyword: search,
        resultCount: Number(countResult[0]?.count || 0),
      });
    }

    if (categoryId) {
      conditions.push(eq(faqs.categoryId, parseInt(categoryId)));
    }

    if (type) {
      conditions.push(eq(faqs.type, type as "platform" | "device" | "other"));
    }

    if (os) {
      conditions.push(eq(faqs.os, os as "Android" | "RTOS" | "Linux" | "any"));
    }

    // Tag filter - get faq IDs with this tag
    if (tagId) {
      const tagFaqs = await db
        .select({ faqId: faqTags.faqId })
        .from(faqTags)
        .where(eq(faqTags.tagId, parseInt(tagId)));
      const faqIds = tagFaqs.map((tf) => tf.faqId);
      if (faqIds.length > 0) {
        conditions.push(inArray(faqs.id, faqIds));
      } else {
        return NextResponse.json({ faqs: [], total: 0, page, limit });
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Sort
    let orderClause;
    switch (sort) {
      case "mostViewed":
        orderClause = desc(faqs.viewCount);
        break;
      case "mostHelpful":
        orderClause = desc(faqs.helpfulCount);
        break;
      case "newest":
        orderClause = desc(faqs.publishedAt);
        break;
      case "recentUpdate":
        orderClause = desc(faqs.updatedAt);
        break;
      default:
        orderClause = desc(faqs.updatedAt);
    }

    const [faqList, countResult] = await Promise.all([
      db
        .select()
        .from(faqs)
        .where(whereClause)
        .orderBy(orderClause)
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(faqs)
        .where(whereClause),
    ]);

    // Get tags and categories for each FAQ
    const faqsWithRelations = await Promise.all(
      faqList.map(async (faq) => {
        const faqTagList = await db
          .select({ tag: tags })
          .from(faqTags)
          .innerJoin(tags, eq(faqTags.tagId, tags.id))
          .where(eq(faqTags.faqId, faq.id));

        let category = null;
        if (faq.categoryId) {
          const catResult = await db
            .select()
            .from(categories)
            .where(eq(categories.id, faq.categoryId))
            .limit(1);
          category = catResult[0] || null;
        }

        return {
          ...faq,
          tags: faqTagList.map((ft) => ft.tag),
          category,
        };
      })
    );

    return NextResponse.json({
      faqs: faqsWithRelations,
      total: Number(countResult[0]?.count || 0),
      page,
      limit,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 403 });
    }

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
    } = body;

    // Validation
    if (!titleZh || !titleZh.trim()) {
      return NextResponse.json({ error: "标题不能为空" }, { status: 400 });
    }
    if (!contentZh || !contentZh.trim()) {
      return NextResponse.json({ error: "内容不能为空" }, { status: 400 });
    }

    // Duplicate check
    const existing = await db
      .select({ id: faqs.id })
      .from(faqs)
      .where(ilike(faqs.titleZh, titleZh.trim()))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: `已存在相同标题的FAQ（ID: ${existing[0].id}），请修改标题或编辑已有FAQ` },
        { status: 400 }
      );
    }

    // Non-admin users: force status to "pending" for review
    let finalStatus = status || "draft";
    if (user.role !== "admin" && finalStatus === "published") {
      finalStatus = "pending";
    }

    const publishedAt = finalStatus === "published" ? new Date() : null;

    const result = await db
      .insert(faqs)
      .values({
        titleZh: titleZh.trim(),
        titleEn: (titleEn || "").trim(),
        contentZh: contentZh.trim(),
        contentEn: (contentEn || "").trim(),
        type: type || "platform",
        os: os || "any",
        visibility: visibility || "public",
        status: finalStatus,
        categoryId: categoryId ? parseInt(categoryId) : null,
        createdBy: user.id,
        updatedBy: user.id,
        publishedAt,
      })
      .returning();

    const newFaq = result[0];

    // Add tags
    if (tagIds && tagIds.length > 0) {
      await db.insert(faqTags).values(
        tagIds.map((tid: number) => ({
          faqId: newFaq.id,
          tagId: tid,
        }))
      );
    }

    // Create initial version
    await db.insert(faqVersions).values({
      faqId: newFaq.id,
      titleZh: titleZh || "",
      titleEn: titleEn || "",
      contentZh: contentZh || "",
      contentEn: contentEn || "",
      changeNote: "Initial creation",
      modifiedBy: user.id,
      versionNumber: 1,
    });

    return NextResponse.json({ faq: newFaq });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
