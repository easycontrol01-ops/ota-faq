"use client";

import { useState, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import CodeBlock from "@tiptap/extension-code-block";
import { ResizableImage, FileAttachment } from "@/lib/tiptap-extensions";

interface RichEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  lang?: "zh" | "en";
}

export default function RichEditor({ value, onChange, placeholder, lang = "zh" }: RichEditorProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const t = (zh: string, en: string) => lang === "zh" ? zh : en;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Underline,
      Link.configure({ openOnClick: false, HTMLAttributes: { style: "color:#444CE7;text-decoration:underline;" } }),
      Table.configure({ resizable: true }), TableRow, TableCell, TableHeader,
      Placeholder.configure({ placeholder: placeholder || t("请输入内容...", "Enter content...") }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      CodeBlock.configure({ HTMLAttributes: { style: "background:#1e293b;color:#e2e8f0;padding:12px;border-radius:8px;font-size:13px;overflow-x:auto;margin:8px 0;" } }),
      ResizableImage,
      FileAttachment,
    ],
    content: value || "",
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none text-[13px] text-gray-700 leading-relaxed px-4 py-3 min-h-[300px] max-h-[600px] overflow-y-auto",
      },
    },
  });

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setDragOver(false); };

  const uploadFile = async (file: File) => {
    setUploadError("");
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success && data.url) {
        if (data.isImage) {
          (editor as any)?.chain().focus().insertContent({
            type: "resizableImage",
            attrs: { src: data.url, alt: file.name, width: "400" },
          }).run();
        } else {
          const sizeStr = data.size < 1024 * 1024 ? (data.size / 1024).toFixed(1) + " KB" : (data.size / (1024 * 1024)).toFixed(1) + " MB";
          const ext = file.name.split(".").pop()?.toUpperCase() || "FILE";
          (editor as any)?.chain().focus().insertContent({
            type: "fileAttachment",
            attrs: { src: data.url, filename: file.name, filesize: sizeStr, filetype: ext },
          }).run();
        }
      } else {
        setUploadError(data.error || t("上传失败", "Upload failed"));
      }
    } catch { setUploadError(t("网络错误", "Network error")); }
    setUploading(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) await uploadFile(files[0]);
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
    e.target.value = "";
  };

  const setImageWidth = (percent: number) => {
    if (!editor) return;
    const cw = Math.min((editor.view.dom as HTMLElement).clientWidth - 64, 720);
    const nw = String(Math.round(cw * percent / 100));
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === "resizableImage") {
        editor.chain().setNodeSelection(pos).updateAttributes("resizableImage", { width: nw }).run();
        return false;
      }
    });
  };

  if (!editor) return <div className="h-[300px] bg-gray-50 rounded-xl animate-pulse" />;

  const btn = "px-2 py-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors text-xs";
  const act = "px-2 py-1.5 text-primary-700 bg-primary-100 rounded text-xs";

  return (
    <div className={`border-2 rounded-xl overflow-hidden bg-white transition-colors ${dragOver ? "border-primary-500 bg-primary-50/30" : "border-gray-200"}`}
      onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-100 bg-gray-50/50 flex-wrap sticky top-0 z-10">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive("bold") ? act : btn}><strong>B</strong></button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive("italic") ? act : btn}><em>I</em></button>
        <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={editor.isActive("strike") ? act : btn}><s>S</s></button>
        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={editor.isActive("underline") ? act : btn}><u>U</u></button>
        <div className="w-px h-4 bg-gray-200 mx-0.5" />
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive("heading", { level: 2 }) ? act : btn}>H2</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={editor.isActive("heading", { level: 3 }) ? act : btn}>H3</button>
        <div className="w-px h-4 bg-gray-200 mx-0.5" />
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive("bulletList") ? act : btn}>• {t("列表", "List")}</button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive("orderedList") ? act : btn}>1.</button>
        <button type="button" onClick={() => { const u = prompt(t("链接URL:", "Link URL:")); if (u) editor.chain().focus().setLink({ href: u }).run(); }} className={editor.isActive("link") ? act : btn}>🔗</button>
        <button type="button" onClick={() => editor.chain().focus().insertTable({ rows: 2, cols: 2 }).run()} className={btn}>{t("表格", "Table")}</button>
        <button type="button" onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={editor.isActive("codeBlock") ? act : btn}>{t("代码", "Code")}</button>
        <div className="w-px h-4 bg-gray-200 mx-0.5" />
        <button type="button" onClick={() => imgInputRef.current?.click()} disabled={uploading} className={btn + (uploading ? " opacity-50" : "")}>🖼 {t("图片", "Img")}</button>
        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className={btn + (uploading ? " opacity-50" : "")}>📎 {t("附件", "File")}</button>
        <div className="w-px h-4 bg-gray-200 mx-0.5" />
        <span className="text-[10px] text-gray-400">{t("缩放:", "Size:")}</span>
        {[25, 50, 75, 100].map(p => <button key={p} type="button" onClick={() => setImageWidth(p)} className={btn}>{p}%</button>)}
        <input ref={imgInputRef} type="file" accept="image/*" onChange={handleInputChange} className="hidden" />
        <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip" onChange={handleInputChange} className="hidden" />
      </div>

      {uploadError && (
        <div className="px-3 py-2 bg-red-50 text-red-600 text-xs border-b border-red-100 flex items-center justify-between">
          ❌ {uploadError}
          <button onClick={() => setUploadError("")} className="text-red-400 hover:text-red-600 ml-2">✕</button>
        </div>
      )}

      <EditorContent editor={editor} />

      <div className="px-3 py-1.5 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
        <span className="text-[11px] text-gray-400">
          {t("所见即所得 · 拖拽文件即可上传 · 图片点击后可缩放", "WYSIWYG · Drag to upload · Click image to resize")}
        </span>
      </div>
    </div>
  );
}
