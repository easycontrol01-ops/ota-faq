import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

const ALLOWED_IMAGES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};

const ALLOWED_FILES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "text/plain": "txt",
  "text/csv": "csv",
  "application/zip": "zip",
};

const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB for images
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB for documents

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 403 });
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

    if (file.size === 0) {
      return NextResponse.json({ error: "文件为空" }, { status: 400 });
    }

    // Determine if image or document
    const isImage = ALLOWED_IMAGES[file.type];
    const isFile = ALLOWED_FILES[file.type];

    if (!isImage && !isFile) {
      return NextResponse.json(
        { error: `不支持的文件格式「${file.type || "未知"}」。支持 JPG/PNG/GIF/WebP/PDF/DOC/DOCX/XLS/XLSX/PPT/PPTX/TXT/CSV/ZIP` },
        { status: 400 }
      );
    }

    const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_FILE_SIZE;
    if (file.size > maxSize) {
      const limitMB = maxSize / 1024 / 1024;
      return NextResponse.json({ error: `文件大小超出限制，最大允许 ${limitMB}MB` }, { status: 400 });
    }

    let bytes: ArrayBuffer;
    try {
      bytes = await file.arrayBuffer();
    } catch {
      return NextResponse.json({ error: "文件读取失败" }, { status: 500 });
    }

    const buffer = Buffer.from(bytes);

    // Validate image magic bytes
    if (isImage) {
      const isJPEG = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
      const isPNG = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
      const isGIF = buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46;
      const isWEBP = buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46;

      if (!isJPEG && !isPNG && !isGIF && !isWEBP) {
        return NextResponse.json({ error: "文件内容与声明的格式不一致" }, { status: 400 });
      }
    }

    // Convert to base64 data URL
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    return NextResponse.json({
      success: true,
      url: dataUrl,
      filename: file.name,
      type: file.type,
      size: file.size,
      isImage: !!isImage,
    });
  } catch (e) {
    console.error("Upload error:", e);
    return NextResponse.json({ error: "上传失败，服务器异常" }, { status: 500 });
  }
}
