import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { db } from "@/db";
import { faqs, faqTags, tags, categories, faqVersions } from "@/db/schema";
import { eq, ilike } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_EXTENSIONS = [".xlsx", ".xls"];
const MAX_TITLE_LENGTH = 500;
const MAX_CONTENT_LENGTH = 50000;
const MAX_ROWS = 500;

interface ImportRow {
  rowNum: number;
  title: string;
  content: string;
  type: string;
  os: string;
  visibility: string;
  categoryName: string;
  tagNames: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

// Strip HTML tags to prevent XSS
function sanitize(text: string): string {
  return text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .replace(/javascript:/gi, "");
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "无权限操作" }, { status: 403 });
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
    }

    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "未选择文件" }, { status: 400 });
    }

    // Validate file extension
    const fileName = file.name.toLowerCase();
    const hasValidExt = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext));
    if (!hasValidExt) {
      return NextResponse.json({ error: `不支持的文件格式，仅支持 ${ALLOWED_EXTENSIONS.join("、")}` }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: `文件大小超出限制，最大允许 5MB` }, { status: 400 });
    }

    if (file.size === 0) {
      return NextResponse.json({ error: "文件为空" }, { status: 400 });
    }

    let buffer: ArrayBuffer;
    try {
      buffer = await file.arrayBuffer();
    } catch {
      return NextResponse.json({ error: "文件读取失败" }, { status: 400 });
    }

    let workbook;
    try {
      workbook = XLSX.read(buffer, { type: "array" });
    } catch {
      return NextResponse.json({ error: "文件解析失败，请确认文件格式正确" }, { status: 400 });
    }

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 });

    if (jsonData.length < 2) {
      return NextResponse.json({
        success: false, total: 0, imported: 0, skipped: 0,
        errors: [{ row: 0, field: "文件", message: "文件为空或没有数据行" }],
      });
    }

    // Limit rows
    if (jsonData.length - 1 > MAX_ROWS) {
      return NextResponse.json({
        success: false, total: jsonData.length - 1, imported: 0, skipped: 0,
        errors: [{ row: 0, field: "文件", message: `数据行数超出限制，最多 ${MAX_ROWS} 行` }],
      });
    }

    const rows: ImportRow[] = [];
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row || row.length === 0 || !row[0]) continue;

      // Map Chinese values to English enum values
      const rawType = (row[2] || "").toString().trim();
      const typeMap: Record<string, string> = { "平台端": "platform", "设备端": "device", "其他": "other", platform: "platform", device: "device", other: "other" };
      const rawOs = (row[3] || "").toString().trim();
      const osMap: Record<string, string> = { "不限": "any", Android: "Android", RTOS: "RTOS", Linux: "Linux", any: "any" };
      const rawVis = (row[4] || "").toString().trim();
      const visMap: Record<string, string> = { "公开": "public", "内部": "internal", public: "public", internal: "internal" };

      rows.push({
        rowNum: i + 1,
        title: sanitize((row[0] || "").toString().trim()),
        content: sanitize((row[1] || "").toString().trim()),
        type: typeMap[rawType] || "platform",
        os: osMap[rawOs] || "any",
        visibility: visMap[rawVis] || "public",
        categoryName: (row[5] || "").toString().trim(),
        tagNames: (row[6] || "").toString().trim(),
      });
    }

    if (rows.length === 0) {
      return NextResponse.json({
        success: false, total: 0, imported: 0, skipped: 0,
        errors: [{ row: 0, field: "文件", message: "未找到有效数据行" }],
      });
    }

    // Validation
    const errors: ValidationError[] = [];
    const validTypes = ["platform", "device", "other"];
    const validOs = ["Android", "RTOS", "Linux", "any"];
    const validVisibility = ["public", "internal"];

    for (const row of rows) {
      if (!row.title) {
        errors.push({ row: row.rowNum, field: "标题", message: "标题不能为空" });
      } else if (row.title.length > MAX_TITLE_LENGTH) {
        errors.push({ row: row.rowNum, field: "标题", message: `标题超出 ${MAX_TITLE_LENGTH} 字限制` });
      }
      if (!row.content) {
        errors.push({ row: row.rowNum, field: "内容", message: "内容不能为空" });
      } else if (row.content.length > MAX_CONTENT_LENGTH) {
        errors.push({ row: row.rowNum, field: "内容", message: `内容超出 ${MAX_CONTENT_LENGTH} 字限制` });
      }
      if (row.type && !validTypes.includes(row.type)) {
        errors.push({ row: row.rowNum, field: "类型", message: "类型必须是: 平台端、设备端 或 其他" });
      }
      if (row.os && !validOs.includes(row.os)) {
        errors.push({ row: row.rowNum, field: "操作系统", message: "操作系统必须是: Android、RTOS、Linux 或 不限" });
      }
      if (row.visibility && !validVisibility.includes(row.visibility)) {
        errors.push({ row: row.rowNum, field: "可见范围", message: "可见范围必须是: 公开 或 内部" });
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({ success: false, total: rows.length, imported: 0, skipped: 0, errors });
    }

    // Preload categories and tags
    const allCategories = await db.select().from(categories);
    const categoryMap = new Map<string, number>();
    for (const cat of allCategories) {
      categoryMap.set(cat.nameZh, cat.id);
      categoryMap.set(cat.nameEn, cat.id);
    }

    const allTags = await db.select().from(tags);
    const tagMap = new Map<string, number>();
    for (const tag of allTags) {
      tagMap.set(tag.name.toLowerCase(), tag.id);
    }

    let importedCount = 0;
    let skippedCount = 0;

    for (const row of rows) {
      try {
        // Duplicate check: same title already exists
        const existingFaq = await db
          .select({ id: faqs.id })
          .from(faqs)
          .where(ilike(faqs.titleZh, row.title))
          .limit(1);

        if (existingFaq.length > 0) {
          skippedCount++;
          errors.push({ row: row.rowNum, field: "标题", message: `已存在相同标题的FAQ（ID: ${existingFaq[0].id}），已跳过` });
          continue;
        }

        let categoryId: number | null = null;
        if (row.categoryName) {
          categoryId = categoryMap.get(row.categoryName) || null;
        }

        const result = await db
          .insert(faqs)
          .values({
            titleZh: row.title,
            titleEn: "",
            contentZh: row.content,
            contentEn: "",
            type: (row.type as "platform" | "device" | "other") || "platform",
            os: (row.os as "Android" | "RTOS" | "Linux" | "any") || "any",
            visibility: (row.visibility as "public" | "internal") || "public",
            status: "draft",
            categoryId,
            createdBy: user.id,
            updatedBy: user.id,
          })
          .returning();

        const newFaq = result[0];

        if (row.tagNames) {
          const tagNameList = row.tagNames.split(",").map(t => t.trim()).filter(t => t && t.length <= 50);

          for (const tagName of tagNameList.slice(0, 10)) {
            let tagId = tagMap.get(tagName.toLowerCase());

            if (!tagId) {
              const newTag = await db.insert(tags).values({ name: tagName }).returning();
              tagId = newTag[0].id;
              tagMap.set(tagName.toLowerCase(), tagId);
            }

            await db.insert(faqTags).values({ faqId: newFaq.id, tagId });
          }
        }

        await db.insert(faqVersions).values({
          faqId: newFaq.id, titleZh: row.title, titleEn: "",
          contentZh: row.content, contentEn: "",
          changeNote: "批量导入", modifiedBy: user.id, versionNumber: 1,
        });

        importedCount++;
      } catch (err) {
        console.error(`Error importing row ${row.rowNum}:`, err);
        errors.push({ row: row.rowNum, field: "系统", message: "导入失败，请检查数据" });
      }
    }

    return NextResponse.json({
      success: true,
      total: rows.length,
      imported: importedCount,
      skipped: skippedCount,
      errors,
    });
  } catch (e) {
    console.error("Import error:", e);
    return NextResponse.json({ error: "导入失败，服务器异常" }, { status: 500 });
  }
}
