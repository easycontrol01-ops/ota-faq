"use client";

import { useState, useRef } from "react";
import { marked } from "marked";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  lang?: "zh" | "en";
}

export default function MarkdownEditor({ value, onChange, placeholder, rows = 14, lang = "zh" }: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const t = (zh: string, en: string) => lang === "zh" ? zh : en;

  const insertAtCursor = (before: string, after: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.substring(start, end);
    const text = selected || t("文本", "text");
    const newText = value.substring(0, start) + before + text + after + value.substring(end);
    onChange(newText);
    setTimeout(() => {
      textarea.focus();
      const cursorPos = start + before.length;
      textarea.setSelectionRange(cursorPos, cursorPos + text.length);
    }, 0);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError("");
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success && data.url) {
        // Use HTML img tag with default width for resizability
        const imgTag = `\n<img src="${data.url}" alt="${file.name}" width="400" />\n`;
        const textarea = textareaRef.current;
        if (textarea) {
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const newContent = value.substring(0, start) + imgTag + value.substring(end);
          onChange(newContent);
        } else {
          onChange(value + imgTag);
        }
      } else {
        setUploadError(data.error || t("上传失败", "Upload failed"));
      }
    } catch {
      setUploadError(t("网络错误，上传失败", "Network error"));
    }
    setUploading(false);
    e.target.value = "";
  };

  const htmlContent = marked.parse(value || "") as string;

  const btnClass = "px-2 py-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors text-xs";

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-100 bg-gray-50/50 flex-wrap">
        <button type="button" onClick={() => insertAtCursor("**", "**")} className={btnClass} title={t("加粗", "Bold")}>
          <strong>B</strong>
        </button>
        <button type="button" onClick={() => insertAtCursor("*", "*")} className={btnClass} title={t("斜体", "Italic")}>
          <em>I</em>
        </button>
        <button type="button" onClick={() => insertAtCursor("~~", "~~")} className={btnClass} title={t("删除线", "Strikethrough")}>
          <s>S</s>
        </button>
        <div className="w-px h-4 bg-gray-200 mx-0.5" />
        <button type="button" onClick={() => insertAtCursor("## ", "")} className={btnClass} title={t("标题", "Heading")}>H2</button>
        <button type="button" onClick={() => insertAtCursor("### ", "")} className={btnClass} title={t("小标题", "Subheading")}>H3</button>
        <div className="w-px h-4 bg-gray-200 mx-0.5" />
        <button type="button" onClick={() => insertAtCursor("- ", "")} className={btnClass} title={t("列表", "List")}>• {t("列表", "List")}</button>
        <button type="button" onClick={() => insertAtCursor("1. ", "")} className={btnClass} title={t("有序列表", "Ordered")}>1.</button>
        <button type="button" onClick={() => insertAtCursor("> ", "")} className={btnClass} title={t("引用", "Quote")}>&gt;</button>
        <div className="w-px h-4 bg-gray-200 mx-0.5" />
        <button type="button" onClick={() => insertAtCursor("`", "`")} className={btnClass} title={t("代码", "Code")}>{t("代码", "Code")}</button>
        <button type="button" onClick={() => insertAtCursor("[", "](https://)")} className={btnClass} title={t("链接", "Link")}>🔗</button>
        <button type="button" onClick={() => insertAtCursor("| " + t("列1", "Col1") + " | " + t("列2", "Col2") + " |\n| --- | --- |\n| | |\n", "")} className={btnClass} title={t("表格", "Table")}>{t("表格", "Table")}</button>

        <div className="w-px h-4 bg-gray-200 mx-0.5" />
        <label className={`${btnClass} cursor-pointer inline-flex items-center gap-1 ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
          {uploading ? (
            <><div className="w-3 h-3 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />{t("上传中", "Uploading")}</>
          ) : (
            <>🖼 {t("图片", "Image")}</>
          )}
          <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleImageUpload} className="hidden" disabled={uploading} />
        </label>

        <div className="ml-auto">
          <button type="button" onClick={() => setShowPreview(!showPreview)}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${showPreview ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            👁 {showPreview ? t("关闭预览", "Close Preview") : t("预览", "Preview")}
          </button>
        </div>
      </div>

      {uploadError && (
        <div className="px-3 py-2 bg-red-50 text-red-600 text-xs border-b border-red-100">
          ❌ {uploadError}
          <button onClick={() => setUploadError("")} className="ml-2 text-red-400 hover:text-red-600">{t("关闭", "Close")}</button>
        </div>
      )}

      {/* Editor or Preview */}
      {!showPreview ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="w-full px-4 py-3 text-sm font-mono text-gray-700 focus:outline-none resize-none leading-relaxed"
        />
      ) : (
        <div className="px-4 py-3 overflow-auto" style={{ minHeight: `${rows * 1.5}rem` }}>
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
            <span className="text-xs text-gray-400">📄 {t("预览效果", "Preview")}</span>
          </div>
          <div
            className="text-[13px] text-gray-600 leading-relaxed
              [&_h1]:text-[14px] [&_h1]:font-semibold [&_h1]:text-gray-800 [&_h1]:mt-4 [&_h1]:mb-2
              [&_h2]:text-[13px] [&_h2]:font-semibold [&_h2]:text-gray-800 [&_h2]:mt-4 [&_h2]:mb-2
              [&_h3]:text-[13px] [&_h3]:font-medium [&_h3]:text-gray-700 [&_h3]:mt-3 [&_h3]:mb-1.5
              [&_p]:mb-2 [&_p]:font-normal
              [&_ul]:pl-4 [&_ul]:mb-2 [&_ul]:list-disc
              [&_ol]:pl-4 [&_ol]:mb-2 [&_ol]:list-decimal
              [&_li]:mb-1 [&_li]:font-normal
              [&_strong]:font-semibold [&_strong]:text-gray-900
              [&_em]:italic
              [&_del]:line-through [&_del]:text-gray-400
              [&_blockquote]:border-l-2 [&_blockquote]:border-primary-300 [&_blockquote]:pl-3 [&_blockquote]:py-1 [&_blockquote]:my-2 [&_blockquote]:text-gray-500 [&_blockquote]:bg-gray-50 [&_blockquote]:rounded-r
              [&_code]:text-[12px] [&_code]:bg-gray-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-primary-600
              [&_pre]:bg-gray-800 [&_pre]:text-gray-200 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:text-[12px] [&_pre]:my-3 [&_pre]:overflow-x-auto
              [&_pre_code]:bg-transparent [&_pre_code]:p-0
              [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-2
              [&_a]:text-primary-600 [&_a]:hover:underline
              [&_table]:w-full [&_table]:border-collapse [&_table]:my-3 [&_table]:text-[12px]
              [&_th]:border [&_th]:border-gray-200 [&_th]:bg-gray-50 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-medium
              [&_td]:border [&_td]:border-gray-200 [&_td]:px-3 [&_td]:py-2
              [&_hr]:my-4 [&_hr]:border-gray-200"
            dangerouslySetInnerHTML={{ __html: htmlContent || `<p class="text-gray-400">${placeholder || ""}</p>` }}
          />
        </div>
      )}

      {/* Footer */}
      <div className="px-3 py-1.5 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
        <span className="text-[11px] text-gray-400">
          {t("支持 Markdown · 图片限 JPG/PNG/GIF/WebP · 最大 2MB", "Markdown supported · Image: JPG/PNG/GIF/WebP · Max 2MB")}
        </span>
        <span className="text-[11px] text-gray-400">{value.length} {t("字", "chars")}</span>
      </div>
    </div>
  );
}
