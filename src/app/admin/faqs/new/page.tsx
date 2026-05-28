"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const RichEditor = dynamic(() => import("@/components/RichEditor"), { ssr: false });

interface Category { id: number; nameZh: string; nameEn: string; }
interface Tag { id: number; name: string; }

export default function NewFAQPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [titleZh, setTitleZh] = useState("");
  const [contentZh, setContentZh] = useState("");
  const [type, setType] = useState("");
  const [os, setOs] = useState("any");
  const [visibility, setVisibility] = useState("public");
  const [categoryId, setCategoryId] = useState("");
  const [selectedTags, setSelectedTags] = useState<number[]>([]);

  useEffect(() => {
    fetch("/api/categories").then(r => r.json()).then(d => setCategories(d.categories || [])).catch(() => {});
    fetch("/api/tags").then(r => r.json()).then(d => setTags(d.tags || [])).catch(() => {});
  }, []);

  const validate = (): string | null => {
    if (!titleZh.trim()) return "请填写标题";
    if (!contentZh.trim() || contentZh === "<p></p>" || contentZh === "<br>") return "请填写内容";
    if (!type) return "请选择类型";
    if (!categoryId) return "请选择分类";
    return null;
  };

  const handleSubmit = async (saveStatus: string) => {
    setError("");
    const err = validate();
    if (err) { setError(err); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/faqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titleZh, titleEn: "", contentZh, contentEn: "", type, os, visibility, status: saveStatus, categoryId, tagIds: selectedTags }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "保存失败"); setSaving(false); return; }
      router.push("/admin/faqs");
    } catch { setError("网络错误"); }
    setSaving(false);
  };

  const toggleTag = (tagId: number) => {
    setSelectedTags(prev => prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]);
  };

  const labelRequired = (text: string) => (
    <label className="block text-xs text-gray-500 mb-1.5">
      {text} <span className="text-red-500">*</span>
    </label>
  );

  const labelOptional = (text: string) => (
    <label className="block text-xs text-gray-500 mb-1.5">{text}</label>
  );

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">新建 FAQ</h1>
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700">← 返回</button>
      </div>

      {error && <div className="bg-red-50 text-red-600 rounded-xl p-3 mb-4 text-sm">❌ {error}</div>}

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            {labelRequired("标题")}
            <input type="text" value={titleZh} onChange={e => setTitleZh(e.target.value)}
              placeholder="请输入FAQ标题"
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-primary-500/30" />
            {labelRequired("内容")}
            <RichEditor value={contentZh} onChange={setContentZh} placeholder="请输入FAQ内容..." />
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="text-sm font-medium text-gray-900 mb-3">属性设置</h2>
            <div className="space-y-3">
              <div>
                {labelRequired("类型")}
                <select value={type} onChange={e => setType(e.target.value)}
                  className={`w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 ${!type ? "border-gray-200 text-gray-400" : "border-gray-200"}`}>
                  <option value="">请选择类型</option>
                  <option value="platform">平台端</option>
                  <option value="device">设备端</option>
                  <option value="other">其他</option>
                </select>
              </div>
              <div>
                {labelOptional("操作系统")}
                <select value={os} onChange={e => setOs(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30">
                  <option value="any">不限</option><option value="Android">Android</option><option value="RTOS">RTOS</option><option value="Linux">Linux</option>
                </select>
              </div>
              <div>
                {labelRequired("可见范围")}
                <select value={visibility} onChange={e => setVisibility(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30">
                  <option value="public">公开</option><option value="internal">内部</option>
                </select>
              </div>
              <div>
                {labelRequired("分类")}
                <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
                  className={`w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 ${!categoryId ? "border-gray-200 text-gray-400" : "border-gray-200"}`}>
                  <option value="">请选择分类</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.nameZh}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            {labelOptional("标签")}
            <div className="flex flex-wrap gap-1.5">
              {tags.map(tag => (
                <button key={tag.id} onClick={() => toggleTag(tag.id)}
                  className={`px-2.5 py-1 rounded-full text-xs transition-all ${selectedTags.includes(tag.id) ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                  {tag.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <button onClick={() => handleSubmit("published")} disabled={saving}
              className="w-full py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
              {saving ? "保存中..." : "保存并发布"}
            </button>
            <button onClick={() => handleSubmit("draft")} disabled={saving}
              className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50">
              保存为草稿
            </button>
          </div>

          <div className="text-xs text-gray-400 space-y-0.5">
            <p><span className="text-red-500">*</span> 为必填项</p>
            <p>💡 员工创建的FAQ需管理员审核后才能发布</p>
          </div>
        </div>
      </div>
    </div>
  );
}
