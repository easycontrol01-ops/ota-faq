import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { db } from "@/db";
import { faqs, faqTags, tags, categories } from "@/db/schema";
import { eq, and, ne, inArray } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

const TYPE_MAP: Record<string, string> = { platform: "平台端", device: "设备端", other: "其他" };
const OS_MAP: Record<string, string> = { Android: "Android", RTOS: "RTOS", Linux: "Linux", any: "不限" };
const VIS_MAP: Record<string, string> = { public: "公开", internal: "内部" };
const STATUS_MAP: Record<string, string> = { draft: "草稿", pending: "待审核", published: "已发布", offline: "已下线", archived: "已归档", deleted: "已删除" };

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const url = request.nextUrl;
    const mode = url.searchParams.get("mode") || "all"; // all, category, single
    const categoryId = url.searchParams.get("categoryId");
    const faqId = url.searchParams.get("faqId");

    // Build query conditions
    const conditions = [ne(faqs.status, "deleted")];

    if (mode === "single" && faqId) {
      conditions.push(eq(faqs.id, parseInt(faqId)));
    } else if (mode === "category" && categoryId) {
      conditions.push(eq(faqs.categoryId, parseInt(categoryId)));
    }

    const faqList = await db
      .select()
      .from(faqs)
      .where(and(...conditions));

    // Get all categories for lookup
    const allCategories = await db.select().from(categories);
    const categoryMap = new Map<number, string>();
    for (const cat of allCategories) {
      categoryMap.set(cat.id, cat.nameZh);
    }

    // Get tags for each FAQ
    const allFaqTags = await db
      .select({ faqId: faqTags.faqId, tagName: tags.name })
      .from(faqTags)
      .innerJoin(tags, eq(faqTags.tagId, tags.id));

    const tagsByFaq = new Map<number, string[]>();
    for (const ft of allFaqTags) {
      if (!tagsByFaq.has(ft.faqId)) tagsByFaq.set(ft.faqId, []);
      tagsByFaq.get(ft.faqId)!.push(ft.tagName);
    }

    // Build Excel data
    const header = [
      "编号", "标题", "内容", "类型", "操作系统", "可见范围",
      "分类", "标签", "状态", "浏览量", "有帮助", "无帮助",
      "创建时间", "更新时间"
    ];

    const rows = faqList.map((faq) => [
      faq.id,
      faq.titleZh,
      faq.contentZh,
      TYPE_MAP[faq.type] || faq.type,
      OS_MAP[faq.os] || faq.os,
      VIS_MAP[faq.visibility] || faq.visibility,
      faq.categoryId ? categoryMap.get(faq.categoryId) || "" : "",
      (tagsByFaq.get(faq.id) || []).join(", "),
      STATUS_MAP[faq.status] || faq.status,
      faq.viewCount,
      faq.helpfulCount,
      faq.notHelpfulCount,
      faq.createdAt ? new Date(faq.createdAt).toLocaleString("zh-CN") : "",
      faq.updatedAt ? new Date(faq.updatedAt).toLocaleString("zh-CN") : "",
    ]);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);

    ws["!cols"] = [
      { wch: 6 }, { wch: 35 }, { wch: 60 }, { wch: 8 }, { wch: 10 },
      { wch: 8 }, { wch: 12 }, { wch: 20 }, { wch: 8 }, { wch: 8 },
      { wch: 8 }, { wch: 8 }, { wch: 18 }, { wch: 18 },
    ];

    let sheetName = "FAQ导出";
    if (mode === "category" && categoryId) {
      sheetName = categoryMap.get(parseInt(categoryId)) || "FAQ导出";
    }

    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    const filename = mode === "single"
      ? `FAQ_${faqId}.xlsx`
      : mode === "category"
        ? `FAQ_${sheetName}.xlsx`
        : "FAQ_ALL.xlsx";

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=${encodeURIComponent(filename)}`,
      },
    });
  } catch (e) {
    console.error("Export error:", e);
    return NextResponse.json({ error: "导出失败" }, { status: 500 });
  }
}
