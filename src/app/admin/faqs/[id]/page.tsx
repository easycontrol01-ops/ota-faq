"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const RichEditor = dynamic(() => import("@/components/RichEditor"), { ssr: false });

interface Category { id: number; nameZh: string; nameEn: string; }
interface Tag { id: number; name: string; }
interface Version { id: number; versionNumber: number; changeNote: string; createdAt: string; }

export default function EditFAQPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const faqId = resolvedParams.id;

  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showVersions, setShowVersions] = useState(false);
  const [changeNote, setChangeNote] = useState("");
  const [loaded, setLoaded] = useState(false);

  const [titleZh, setTitleZh] = useState("");
  const [contentZh, setContentZh] = useState("");
  const [type, setType] = useState("platform");
  const [os, setOs] = useState("any");
  const [visibility, setVisibility] = useState("public");
  const [status, setStatus] = useState("draft");
  const [categoryId, setCategoryId] = useState("");
  const [selectedTags, setSelectedTags] = useState<number[]>([]);

  useEffect(() => {
    fetch("/api/categories").then(r => r.json()).then(d => setCategories(d.categories || [])).catch(() => {});
    fetch("/api/tags").then(r => r.json()).then(d => setTags(d.tags || [])).catch(() => {});
    fetch(`/api/faqs/${faqId}`).then(r => r.json()).then(d => {
      const f = d.faq;
      if (f) {
        setTitleZh(f.titleZh || ""); setContentZh(f.contentZh || "");
        setType(f.type); setOs(f.os); setVisibility(f.visibility); setStatus(f.status);
        setCategoryId(f.categoryId ? String(f.categoryId) : "");
        setSelectedTags(f.tags?.map((t: Tag) => t.id) || []);
      }
      setLoaded(true);
    }).catch(() => setLoaded(true));
    fetch(`/api/faqs/${faqId}/versions`).then(r => r.json()).then(d => setVersions(d.versions || [])).catch(() => {});
  }, [faqId]);

  const validate = (): string | null => {
    if (!titleZh.trim()) return "请填写标题";
    if (!contentZh.trim() || contentZh === "<p></p>" || contentZh === "<br>") return "请填写内容";
    if (!type) return "请选择类型";
    if (!categoryId) return "请选择分类";
    return null;
  };

  const handleSubmit = async (saveStatus?: string) => {
    setError("");
    const err = validate();
    if (err) { setError(err); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/faqs/${faqId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titleZh, titleEn: "", contentZh, contentEn: "", type, os, visibility, status: saveStatus || status, categoryId, tagIds: selectedTags, changeNote }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "保存失败"); setSaving(false); return; }
      router.push("/admin/faqs");
    } catch { setError("网络错误"); }
    setSaving(false);
  };

  const rollbackVersion = async (versionId: number) => {
    if (!confirm("确认回滚到此版本？")) return;
    const res = await fetch(`/api/faqs/${faqId}/versions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ versionId }) });
    if (res.ok) window.location.reload();
  };

  const toggleTag = (tagId: number) => {
    setSelectedTags(prev => prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]);
  };

  const statusLabels: Record<string, string> = { draft: "草稿", pending: "待审核", published: "已发布", offline: "已下线", archived: "已归档" };

  const labelRequired = (text: string) => (
    <label className="block text-xs text-gray-500 mb-1.5">{text} <span className="text-red-500">*</span></label>
  );
  const labelOptional = (text: string) => (
    <label className="block text-xs text-gray-500 mb-1.5">{text}</label>
  );

  if (!loaded) {
    return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">编辑 FAQ</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowVersions(!showVersions)}
            className="px-3 py-1.5 text-xs text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100">
            📜 历史 ({versions.length})
          </button>
          <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700">← 返回</button>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-600 rounded-xl p-3 mb-4 text-sm">❌ {error}</div>}

      {status === "pending" && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-sm text-amber-800">⏳ 此FAQ正在等待管理员审核</div>
      )}

      {showVersions && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 mb-5">
          <h2 className="text-sm font-medium text-gray-900 mb-3">历史版本</h2>
          {versions.length === 0 ? <p className="text-xs text-gray-400">暂无</p> : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {versions.map(v => (
                <div key={v.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="text-sm font-medium text-gray-700">v{v.versionNumber}</span>
                    <span className="text-xs text-gray-400 ml-3">{new Date(v.createdAt).toLocaleString()}</span>
                    {v.changeNote && <p className="text-xs text-gray-500 mt-0.5">{v.changeNote}</p>}
                  </div>
                  <button onClick={() => rollbackVersion(v.id)} className="px-3 py-1 text-xs text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100">回滚</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            {labelRequired("标题")}
            <input type="text" value={titleZh} onChange={e => setTitleZh(e.target.value)} placeholder="请输入FAQ标题"
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-primary-500/30" />
            {labelRequired("内容")}
            <RichEditor value={contentZh} onChange={setContentZh} placeholder="请输入FAQ内容..." />
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            {labelOptional("修改备注")}
            <input type="text" value={changeNote} onChange={e => setChangeNote(e.target.value)} placeholder="本次修改说明..."
              className="w-full px-3 py-2.5 bg-gray-50 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30" />
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="text-sm font-medium text-gray-900 mb-3">属性设置</h2>
            <div className="space-y-3">
              <div>
                {labelOptional("当前状态")}
                <select value={status} onChange={e => setStatus(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30">
                  {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                {labelRequired("类型")}
                <select value={type} onChange={e => setType(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30">
                  <option value="">请选择类型</option>
                  <option value="platform">平台端</option><option value="device">设备端</option><option value="other">其他</option>
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
                <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30">
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
            <button onClick={() => handleSubmit()} disabled={saving}
              className="w-full py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
              {saving ? "保存中..." : "保存修改"}
            </button>
            {status !== "published" && (
              <button onClick={() => handleSubmit("published")} disabled={saving}
                className="w-full py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                审核通过并发布
              </button>
            )}
          </div>

          <p className="text-xs text-gray-400"><span className="text-red-500">*</span> 为必填项</p>
        </div>
      </div>
    </div>
  );
}
