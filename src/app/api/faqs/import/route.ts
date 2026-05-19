import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { db } from "@/db";
import { faqs, faqTags, tags, categories, faqVersions } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

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

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 });
    
    if (jsonData.length < 2) {
      return NextResponse.json({ 
        success: false,
        error: "文件为空或格式不正确",
        total: 0,
        imported: 0,
        errors: []
      }, { status: 400 });
    }

    const rows: ImportRow[] = [];
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row || row.length === 0 || !row[0]) continue;
      
      rows.push({
        rowNum: i + 1,
        title: (row[0] || "").toString().trim(),
        content: (row[1] || "").toString().trim(),
        type: (row[2] || "platform").toString().trim().toLowerCase(),
        os: (row[3] || "any").toString().trim(),
        visibility: (row[4] || "public").toString().trim().toLowerCase(),
        categoryName: (row[5] || "").toString().trim(),
        tagNames: (row[6] || "").toString().trim(),
      });
    }

    const errors: ValidationError[] = [];
    const validTypes = ["platform", "device"];
    const validOs = ["Android", "RTOS", "Linux", "any"];
    const validVisibility = ["public", "internal"];

    for (const row of rows) {
      if (!row.title) {
        errors.push({ row: row.rowNum, field: "标题", message: "标题不能为空" });
      }
      if (!row.content) {
        errors.push({ row: row.rowNum, field: "内容", message: "内容不能为空" });
      }
      if (row.type && !validTypes.includes(row.type)) {
        errors.push({ row: row.rowNum, field: "类型", message: "类型必须是: platform 或 device" });
      }
      if (row.os && !validOs.includes(row.os)) {
        errors.push({ row: row.rowNum, field: "操作系统", message: "操作系统必须是: Android, RTOS, Linux, any" });
      }
      if (row.visibility && !validVisibility.includes(row.visibility)) {
        errors.push({ row: row.rowNum, field: "可见范围", message: "可见范围必须是: public 或 internal" });
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        total: rows.length,
        imported: 0,
        errors: errors,
      });
    }

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

    for (const row of rows) {
      try {
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
            type: (row.type as "platform" | "device") || "platform",
            os: (row.os as "Android" | "RTOS" | "Linux" | "any") || "any",
            visibility: (row.visibility as "public" | "internal") || "public",
            status: "draft",
            categoryId: categoryId,
            createdBy: user.id,
            updatedBy: user.id,
          })
          .returning();

        const newFaq = result[0];

        if (row.tagNames) {
          const tagNameList = row.tagNames.split(",").map(t => t.trim()).filter(t => t);
          
          for (const tagName of tagNameList) {
            let tagId = tagMap.get(tagName.toLowerCase());
            
            if (!tagId) {
              const newTag = await db
                .insert(tags)
                .values({ name: tagName })
                .returning();
              tagId = newTag[0].id;
              tagMap.set(tagName.toLowerCase(), tagId);
            }

            await db.insert(faqTags).values({
              faqId: newFaq.id,
              tagId: tagId,
            });
          }
        }

        await db.insert(faqVersions).values({
          faqId: newFaq.id,
          titleZh: row.title,
          titleEn: "",
          contentZh: row.content,
          contentEn: "",
          changeNote: "批量导入",
          modifiedBy: user.id,
          versionNumber: 1,
        });

        importedCount++;
      } catch (err) {
        console.error(`Error importing row ${row.rowNum}:`, err);
        errors.push({ row: row.rowNum, field: "系统", message: "导入失败，请检查数据格式" });
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      total: rows.length,
      imported: importedCount,
      errors: errors,
    });
  } catch (e) {
    console.error("Import error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
