"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Document {
  id: number;
  titleZh: string;
  contentZh: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminDocumentsPage() {
  const router = useRouter();
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const loadDocs = () => {
    setLoading(true);
    // Use FAQ API with type=other and a special category for documents
    const params = new URLSearchParams();
    params.set("status", "published");
    params.set("sort", "recentUpdate");
    params.set("limit", "50");

    fetch(`/api/faqs?${params.toString()}`)
      .then(r => r.json())
      .then(d => {
        // Filter only "doc" type
        const allFaqs = d.faqs || [];
        setDocs(allFaqs.filter((f: Document & { type: string }) => f.type === "other"));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { loadDocs(); }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success && data.url) {
        const sizeStr = data.size < 1024 * 1024
          ? (data.size / 1024).toFixed(1) + " KB"
          : (data.size / (1024 * 1024)).toFixed(1) + " MB";
        const ext = file.name.split(".").pop()?.toUpperCase() || "FILE";
        const fileCard = `<div style="display:flex;align-items:center;gap:10px;padding:12px 16px;background:#f5f7fa;border:1px solid #e2e8f0;border-radius:8px;margin:6px 0;max-width:480px;">
          <div style="font-size:24px;">📎</div>
          <div style="min-width:0;flex:1;">
            <div style="font-size:13px;font-weight:500;color:#1a202c;word-break:break-all;">${file.name}</div>
            <div style="font-size:11px;color:#a0aec0;margin-top:2px;">${ext} · ${sizeStr} · <a href="${data.url}" download="${file.name}" style="color:#444CE7;text-decoration:underline;">下载</a></div>
          </div>
        </div>`;
        setContent(prev => prev + fileCard + "<p></p>");
      } else {
        setError(data.error || "上传失败");
      }
    } catch { setError("网络错误"); }
    setUploading(false);
    e.target.value = "";
  };

  const handleSave = async () => {
    if (!title.trim()) { setError("请填写文档名称"); return; }
    setSaving(true); setError("");
    try {
      const url = editId ? `/api/faqs/${editId}` : "/api/faqs";
      const method = editId ? "PUT" : "POST";
      const body: Record<string, unknown> = {
        titleZh: title, titleEn: "",
        contentZh: content, contentEn: "",
        type: "other", os: "any", visibility: "internal",
        status: "published", categoryId: null,
        tagIds: [],
      };
      if (editId) body.changeNote = "文档更新";

      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "保存失败"); setSaving(false); return; }
      resetForm(); loadDocs();
    } catch { setError("网络错误"); }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确认删除该文档？")) return;
    await fetch(`/api/faqs/${id}?permanent=true`, { method: "DELETE" });
    loadDocs();
  };

  const editDoc = (doc: Document) => {
    setEditId(doc.id);
    setTitle(doc.titleZh);
    setContent(doc.contentZh);
    setShowForm(true);
  };

  const resetForm = () => {
    setTitle(""); setContent(""); setEditId(null); setShowForm(false); setError("");
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">📁 文档管理</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="px-4 py-2 bg-primary-600 text-white rounded-full text-sm font-medium hover:bg-primary-700">
          + 新建文档
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
        <h3 className="text-sm font-medium text-amber-900 mb-1">📋 文档说明</h3>
        <p className="text-xs text-amber-700">
          文档模块用于存放产品手册、操作指南、技术规范等文件。支持上传 PDF/DOC/DOCX/XLS/XLSX/PPT/PPTX/TXT/CSV/ZIP 格式附件，单个文件最大 10MB。
        </p>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          <h2 className="text-sm font-medium text-gray-900 mb-4">{editId ? "编辑文档" : "新建文档"}</h2>
          {error && <div className="bg-red-50 text-red-600 rounded-lg p-3 mb-4 text-sm">❌ {error}</div>}

          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">文档名称 <span className="text-red-500">*</span></label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                placeholder="例如：OTA升级操作手册 v2.0"
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30" />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1.5">文档描述（可选）</label>
              <textarea value={content} onChange={e => setContent(e.target.value)}
                placeholder="可在此处描述文档内容，或直接粘贴附件上传后的文件卡片..."
                rows={6}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/30 resize-none" />
            </div>

            <div>
              <label className={`inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 cursor-pointer transition-colors ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
                {uploading ? (
                  <><div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /> 上传中...</>
                ) : (
                  <>📎 上传附件</>
                )}
                <input type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"
                  onChange={handleUpload} className="hidden" disabled={uploading} />
              </label>
              <p className="text-[11px] text-gray-400 mt-1.5">
                支持 PDF / DOC / DOCX / XLS / XLSX / PPT / PPTX / TXT / CSV / ZIP · 最大 10MB
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={handleSave} disabled={saving}
                className="px-5 py-2.5 bg-primary-600 text-white rounded-full text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
                {saving ? "保存中..." : (editId ? "更新" : "保存")}
              </button>
              <button onClick={resetForm} className="px-5 py-2.5 text-gray-500 hover:text-gray-700 text-sm">
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : docs.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-400">暂无文档</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {docs.map((doc: Document & { type?: string }) => (
              <div key={doc.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors group">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 text-xl">📄</div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{doc.titleZh}</div>
                    <div className="text-xs text-gray-400 mt-0.5">更新于 {new Date(doc.updatedAt).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => editDoc(doc)} className="px-3 py-1.5 text-xs text-primary-600 hover:bg-primary-50 rounded-lg">编辑</button>
                  <button onClick={() => handleDelete(doc.id)} className="px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded-lg">删除</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
