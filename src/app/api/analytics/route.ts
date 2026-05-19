import { NextResponse } from "next/server";
import { db } from "@/db";
import { faqs, searchLogs, feedbacks } from "@/db/schema";
import { sql, desc, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Total stats
    const totalFaqsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(faqs);

    const publishedFaqsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(faqs)
      .where(eq(faqs.status, "published"));

    const draftFaqsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(faqs)
      .where(eq(faqs.status, "draft"));

    const totalViewsResult = await db
      .select({ total: sql<number>`coalesce(sum(${faqs.viewCount}), 0)` })
      .from(faqs);

    // Top viewed FAQs
    const topViewed = await db
      .select({
        id: faqs.id,
        titleZh: faqs.titleZh,
        titleEn: faqs.titleEn,
        viewCount: faqs.viewCount,
      })
      .from(faqs)
      .orderBy(desc(faqs.viewCount))
      .limit(10);

    // Top search keywords
    const topSearches = await db
      .select({
        keyword: searchLogs.keyword,
        count: sql<number>`count(*)`,
        avgResults: sql<number>`avg(${searchLogs.resultCount})`,
      })
      .from(searchLogs)
      .groupBy(searchLogs.keyword)
      .orderBy(desc(sql`count(*)`))
      .limit(10);

    // Zero result searches
    const zeroResults = await db
      .select({
        keyword: searchLogs.keyword,
        count: sql<number>`count(*)`,
      })
      .from(searchLogs)
      .where(eq(searchLogs.resultCount, 0))
      .groupBy(searchLogs.keyword)
      .orderBy(desc(sql`count(*)`))
      .limit(10);

    // FAQ help rates
    const faqHelpRates = await db
      .select({
        id: faqs.id,
        titleZh: faqs.titleZh,
        titleEn: faqs.titleEn,
        helpfulCount: faqs.helpfulCount,
        notHelpfulCount: faqs.notHelpfulCount,
        helpRate: sql<number>`case when (${faqs.helpfulCount} + ${faqs.notHelpfulCount}) > 0 then round(${faqs.helpfulCount}::numeric / (${faqs.helpfulCount} + ${faqs.notHelpfulCount})::numeric * 100, 1) else 0 end`,
      })
      .from(faqs)
      .where(sql`${faqs.helpfulCount} + ${faqs.notHelpfulCount} > 0`)
      .orderBy(sql`case when (${faqs.helpfulCount} + ${faqs.notHelpfulCount}) > 0 then ${faqs.helpfulCount}::numeric / (${faqs.helpfulCount} + ${faqs.notHelpfulCount})::numeric else 0 end`)
      .limit(10);

    return NextResponse.json({
      totalFaqs: Number(totalFaqsResult[0]?.count || 0),
      publishedFaqs: Number(publishedFaqsResult[0]?.count || 0),
      draftFaqs: Number(draftFaqsResult[0]?.count || 0),
      totalViews: Number(totalViewsResult[0]?.total || 0),
      topViewed,
      topSearches,
      zeroResults,
      faqHelpRates,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
