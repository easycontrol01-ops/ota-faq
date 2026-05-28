"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface FAQ {
  id: number; titleZh: string; status: string; visibility: string; type: string;
  viewCount: number; updatedAt: string;
  category: { id: number; nameZh: string } | null;
}

interface Category { id: number; nameZh: string; nameEn: string; }

export default function AdminFAQsPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [visibility, setVisibility] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [batchLoading, setBatchLoading] = useState(false);
  const [showRecycleBin, setShowRecycleBin] = useState(false);

  useEffect(() => {
    fetch("/api/categories").then(r => r.json()).then(d => setCategories(d.categories || [])).catch(() => {});
  }, []);

  const loadFaqs = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (showRecycleBin) {
      params.set("status", "deleted");
    } else if (status) {
      params.set("status", status);
    }
    if (visibility) params.set("visibility", visibility);
    params.set("page", String(page));
    params.set("limit", "15");
    params.set("sort", "recentUpdate");

    fetch(`/api/faqs?${params.toString()}`)
      .then(r => r.json())
      .then(d => { setFaqs(d.faqs || []); setTotal(d.total || 0); setLoading(false); setSelectedIds([]); })
      .catch(() => setLoading(false));
  }, [search, status, visibility, page, showRecycleBin]);

  useEffect(() => { loadFaqs(); }, [loadFaqs]);

  const softDelete = async (id: number) => {
    if (!confirm("确认移到回收站？")) return;
    await fetch(`/api/faqs/${id}`, { method: "DELETE" });
    loadFaqs();
  };

  const permanentDelete = async (id: number) => {
    if (!confirm("确认永久删除？此操作不可撤销！")) return;
    await fetch(`/api/faqs/${id}?permanent=true`, { method: "DELETE" });
    loadFaqs();
  };

  const restoreFaq = async (id: number) => {
    await fetch(`/api/faqs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "draft" }),
    });
    loadFaqs();
  };

  const updateStatus = async (id: number, newStatus: string) => {
    await fetch(`/api/faqs/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    loadFaqs();
  };

  const batchAction = async (action: "publish" | "offline" | "delete") => {
    if (selectedIds.length === 0) return;
    const msg = action === "publish" ? "批量发布" : action === "offline" ? "批量下线" : "批量移到回收站";
    if (!confirm(`确认${msg} ${selectedIds.length} 条FAQ？`)) return;
    setBatchLoading(true);
    for (const id of selectedIds) {
      if (action === "delete") {
        await fetch(`/api/faqs/${id}`, { method: "DELETE" });
      } else {
        await fetch(`/api/faqs/${id}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: action === "publish" ? "published" : "offline" }),
        });
      }
    }
    setBatchLoading(false);
    loadFaqs();
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.length === faqs.length ? [] : faqs.map(f => f.id));
  };

  const exportFaqs = (mode: string, catId?: number) => {
    let url = `/api/faqs/export?mode=${mode}`;
    if (catId) url += `&categoryId=${catId}`;
    window.location.href = url;
  };

  const statusBadge = (s: string) => {
    const styles: Record<string, string> = {
      draft: "bg-gray-100 text-gray-600", pending: "bg-amber-100 text-amber-700",
      published: "bg-green-100 text-green-700", offline: "bg-slate-100 text-slate-600",
      archived: "bg-red-100 text-red-600", deleted: "bg-red-50 text-red-400",
    };
    const labels: Record<string, string> = {
      draft: "草稿", pending: "待审核", published: "已发布",
      offline: "已下线", archived: "已归档", deleted: "已删除",
    };
    return <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${styles[s] || ""}`}>{labels[s] || s}</span>;
  };

  const totalPages = Math.ceil(total / 15);
  const [showExportMenu, setShowExportMenu] = useState(false);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-gray-900">
            {showRecycleBin ? "🗑️ 回收站" : "FAQ管理"}
          </h1>
          <button onClick={() => { setShowRecycleBin(!showRecycleBin); setPage(1); setSelectedIds([]); }}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${showRecycleBin ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {showRecycleBin ? "← 返回FAQ列表" : "🗑️ 回收站"}
          </button>
        </div>
        {!showRecycleBin && (
          <div className="flex items-center gap-2">
            {/* Export Menu */}
            <div className="relative">
              <button onClick={() => setShowExportMenu(!showExportMenu)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                导出
              </button>
              {showExportMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)} />
                  <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1 max-h-80 overflow-y-auto">
                    <button onClick={() => { exportFaqs("all"); setShowExportMenu(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                      📦 全量导出
                    </button>
                    <div className="border-t border-gray-100 my-1" />
                    <div className="px-4 py-1.5 text-xs text-gray-400">按分类导出</div>
                    {categories.map(cat => (
                      <button key={cat.id} onClick={() => { exportFaqs("category", cat.id); setShowExportMenu(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                        📂 {cat.nameZh}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <Link href="/admin/faqs/import"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 flex items-center gap-1.5">
              📥 批量导入
            </Link>
            <Link href="/admin/faqs/new"
              className="px-4 py-2 bg-primary-600 text-white rounded-full text-sm font-medium hover:bg-primary-700">
              + 新建FAQ
            </Link>
          </div>
        )}
      </div>

      {/* Filters (not shown in recycle bin) */}
      {!showRecycleBin && (
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="搜索..."
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm flex-1 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-primary-500/30" />
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30">
            <option value="">全部状态</option>
            <option value="draft">草稿</option><option value="pending">待审核</option>
            <option value="published">已发布</option><option value="offline">已下线</option>
            <option value="archived">已归档</option>
          </select>
          <select value={visibility} onChange={e => { setVisibility(e.target.value); setPage(1); }}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30">
            <option value="">全部范围</option><option value="public">公开</option><option value="internal">内部</option>
          </select>
        </div>
      )}

      {/* Batch Actions */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 mb-4 px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl">
          <span className="text-sm text-primary-700 font-medium">已选 {selectedIds.length} 条</span>
          {showRecycleBin ? (
            <>
              <button onClick={async () => {
                if (!confirm(`确认恢复 ${selectedIds.length} 条FAQ？`)) return;
                setBatchLoading(true);
                for (const id of selectedIds) await restoreFaq(id);
                setBatchLoading(false); loadFaqs();
              }} disabled={batchLoading} className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">批量恢复</button>
              <button onClick={async () => {
                if (!confirm(`确认永久删除 ${selectedIds.length} 条FAQ？不可撤销！`)) return;
                setBatchLoading(true);
                for (const id of selectedIds) await fetch(`/api/faqs/${id}?permanent=true`, { method: "DELETE" });
                setBatchLoading(false); loadFaqs();
              }} disabled={batchLoading} className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">永久删除</button>
            </>
          ) : (
            <>
              <button onClick={() => batchAction("publish")} disabled={batchLoading} className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">批量发布</button>
              <button onClick={() => batchAction("offline")} disabled={batchLoading} className="px-3 py-1.5 text-xs bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50">批量下线</button>
              <button onClick={() => batchAction("delete")} disabled={batchLoading} className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">批量删除</button>
            </>
          )}
          <button onClick={() => setSelectedIds([])} className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700">取消</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : faqs.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-400">
            {showRecycleBin ? "回收站为空" : "暂无FAQ"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-4 py-3 w-10">
                    <input type="checkbox" checked={selectedIds.length === faqs.length && faqs.length > 0}
                      onChange={toggleSelectAll} className="w-4 h-4 rounded border-gray-300 text-primary-600" />
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 w-[35%]">标题</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 whitespace-nowrap">分类</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 whitespace-nowrap">状态</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 whitespace-nowrap">范围</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 whitespace-nowrap">浏览</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 whitespace-nowrap">更新</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 whitespace-nowrap">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {faqs.map(faq => (
                  <tr key={faq.id} className={`hover:bg-gray-50/50 ${selectedIds.includes(faq.id) ? "bg-primary-50/30" : ""}`}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selectedIds.includes(faq.id)}
                        onChange={() => toggleSelect(faq.id)} className="w-4 h-4 rounded border-gray-300 text-primary-600" />
                    </td>
                    <td className="px-4 py-3 max-w-0">
                      <Link href={`/admin/faqs/${faq.id}`} className="text-sm font-medium text-gray-900 hover:text-primary-600 truncate block" title={faq.titleZh}>
                        {faq.titleZh}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{faq.category?.nameZh || "-"}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{statusBadge(faq.status)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${faq.visibility === "public" ? "bg-blue-100 text-blue-600" : "bg-amber-100 text-amber-600"}`}>
                        {faq.visibility === "public" ? "公开" : "内部"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{faq.viewCount}</td>
                    <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">{new Date(faq.updatedAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {showRecycleBin ? (
                          <>
                            <button onClick={() => restoreFaq(faq.id)} className="text-sm text-green-600 hover:text-green-700">恢复</button>
                            <button onClick={() => permanentDelete(faq.id)} className="text-sm text-red-500 hover:text-red-600">永久删除</button>
                          </>
                        ) : (
                          <>
                            <Link href={`/admin/faqs/${faq.id}`} className="text-sm text-primary-600 hover:text-primary-700">编辑</Link>
                            {faq.status === "draft" && <button onClick={() => updateStatus(faq.id, "published")} className="text-sm text-green-600 hover:text-green-700">发布</button>}
                            {faq.status === "pending" && <button onClick={() => updateStatus(faq.id, "published")} className="text-sm text-green-600 hover:text-green-700 font-medium">✓ 通过</button>}
                            {faq.status === "pending" && <button onClick={() => updateStatus(faq.id, "draft")} className="text-sm text-amber-600 hover:text-amber-700">退回</button>}
                            {faq.status === "published" && <button onClick={() => updateStatus(faq.id, "offline")} className="text-sm text-gray-500 hover:text-gray-700">下线</button>}
                            {faq.status === "offline" && <button onClick={() => updateStatus(faq.id, "published")} className="text-sm text-green-600 hover:text-green-700">重新发布</button>}
                            <button onClick={() => softDelete(faq.id)} className="text-sm text-red-500 hover:text-red-600">删除</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
            className="px-4 py-2 rounded-lg text-sm border border-gray-200 disabled:opacity-50 hover:bg-gray-50">上一页</button>
          <span className="text-sm text-gray-500 px-4">{page} / {totalPages}</span>
          <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
            className="px-4 py-2 rounded-lg text-sm border border-gray-200 disabled:opacity-50 hover:bg-gray-50">下一页</button>
        </div>
      )}
    </div>
  );
}
