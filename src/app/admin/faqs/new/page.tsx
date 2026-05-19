"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface Category {
  id: number;
  nameZh: string;
  nameEn: string;
}

interface Tag {
  id: number;
  name: string;
}

export default function NewFAQPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [titleZh, setTitleZh] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [contentZh, setContentZh] = useState("");
  const [contentEn, setContentEn] = useState("");
  const [type, setType] = useState("platform");
  const [os, setOs] = useState("any");
  const [visibility, setVisibility] = useState("public");
  const [categoryId, setCategoryId] = useState("");
  const [selectedTags, setSelectedTags] = useState<number[]>([]);

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then((d) => setCategories(d.categories || [])).catch(() => {});
    fetch("/api/tags").then((r) => r.json()).then((d) => setTags(d.tags || [])).catch(() => {});
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      
      if (data.success && data.url) {
        // Insert image markdown at cursor position
        const textarea = textareaRef.current;
        if (textarea) {
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const imageMarkdown = `![${file.name}](${data.url})`;
          const newContent = contentZh.substring(0, start) + imageMarkdown + contentZh.substring(end);
          setContentZh(newContent);
          // Set cursor position after the inserted image
          setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + imageMarkdown.length, start + imageMarkdown.length);
          }, 0);
        } else {
          setContentZh(contentZh + `\n![${file.name}](${data.url})\n`);
        }
      } else {
        alert(data.error || "图片上传失败");
      }
    } catch {
      alert("图片上传失败");
    }
    setUploading(false);
    e.target.value = "";
  };

  const handleSubmit = async (saveStatus: string) => {
    if (!titleZh) { alert("请填写标题"); return; }
    if (!contentZh) { alert("请填写内容"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/faqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titleZh, titleEn, contentZh, contentEn, type, os, visibility,
          status: saveStatus, categoryId: categoryId || null, tagIds: selectedTags,
        }),
      });
      if (res.ok) router.push("/admin/faqs");
      else alert("保存失败");
    } catch { alert("保存失败"); }
    setSaving(false);
  };

  const toggleTag = (tagId: number) => {
    setSelectedTags((prev) => prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">新建 FAQ</h1>
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700">← 返回</button>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Chinese Content */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="text-sm font-medium text-gray-900 mb-3">内容编辑</h2>
            <input
              type="text" value={titleZh} onChange={(e) => setTitleZh(e.target.value)}
              placeholder="FAQ标题 *"
              className="w-full px-3 py-2.5 bg-gray-50 border-0 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            />
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={contentZh} onChange={(e) => setContentZh(e.target.value)}
                placeholder="FAQ内容（支持Markdown格式）*"
                rows={14}
                className="w-full px-3 py-2.5 bg-gray-50 border-0 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/30 resize-none"
              />
              {/* Image Upload Button */}
              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <label className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-600 cursor-pointer hover:bg-gray-50 transition-colors ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
                  {uploading ? (
                    <>
                      <div className="w-3 h-3 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                      上传中...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      插入图片
                    </>
                  )}
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                </label>
              </div>
            </div>
            <p className="text-[11px] text-gray-400 mt-2">支持 Markdown 格式，可点击右下角按钮插入图片</p>
          </div>

          {/* English Content (Optional) */}
          <details className="bg-white rounded-xl border border-gray-100">
            <summary className="px-5 py-3 text-sm text-gray-500 cursor-pointer hover:text-gray-700">English Content（可选）</summary>
            <div className="px-5 pb-5">
              <input
                type="text" value={titleEn} onChange={(e) => setTitleEn(e.target.value)}
                placeholder="FAQ Title (English)"
                className="w-full px-3 py-2.5 bg-gray-50 border-0 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              />
              <textarea
                value={contentEn} onChange={(e) => setContentEn(e.target.value)}
                placeholder="FAQ Content (English, Markdown supported)"
                rows={8}
                className="w-full px-3 py-2.5 bg-gray-50 border-0 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/30 resize-none"
              />
            </div>
          </details>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="text-sm font-medium text-gray-900 mb-3">属性设置</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">类型</label>
                <select value={type} onChange={(e) => setType(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30">
                  <option value="platform">平台端</option>
                  <option value="device">设备端</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">操作系统</label>
                <select value={os} onChange={(e) => setOs(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30">
                  <option value="any">不限</option>
                  <option value="Android">Android</option>
                  <option value="RTOS">RTOS</option>
                  <option value="Linux">Linux</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">可见范围</label>
                <select value={visibility} onChange={(e) => setVisibility(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30">
                  <option value="public">公开</option>
                  <option value="internal">内部</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">分类</label>
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30">
                  <option value="">请选择分类</option>
                  {categories.map((c) => (<option key={c.id} value={c.id}>{c.nameZh}</option>))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="text-sm font-medium text-gray-900 mb-3">标签</h2>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <button key={tag.id} onClick={() => toggleTag(tag.id)}
                  className={`px-2.5 py-1 rounded-full text-xs transition-all ${selectedTags.includes(tag.id) ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                  {tag.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <button onClick={() => handleSubmit("published")} disabled={saving}
              className="w-full py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50">
              {saving ? "保存中..." : "保存并发布"}
            </button>
            <button onClick={() => handleSubmit("draft")} disabled={saving}
              className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50">
              保存为草稿
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
