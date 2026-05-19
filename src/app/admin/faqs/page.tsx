"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface FAQ {
  id: number;
  titleZh: string;
  titleEn: string;
  status: string;
  visibility: string;
  type: string;
  os: string;
  viewCount: number;
  helpfulCount: number;
  updatedAt: string;
  category: { id: number; nameZh: string } | null;
  tags: { id: number; name: string }[];
}

export default function AdminFAQsPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [visibility, setVisibility] = useState("");
  const [loading, setLoading] = useState(true);

  const loadFaqs = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    if (visibility) params.set("visibility", visibility);
    params.set("page", String(page));
    params.set("limit", "15");
    params.set("sort", "recentUpdate");

    fetch(`/api/faqs?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        setFaqs(d.faqs || []);
        setTotal(d.total || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [search, status, visibility, page]);

  useEffect(() => {
    loadFaqs();
  }, [loadFaqs]);

  const deleteFaq = async (id: number) => {
    if (!confirm("确认删除该FAQ？")) return;
    await fetch(`/api/faqs/${id}`, { method: "DELETE" });
    loadFaqs();
  };

  const updateStatus = async (id: number, newStatus: string) => {
    await fetch(`/api/faqs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    loadFaqs();
  };

  const statusBadge = (s: string) => {
    const styles: Record<string, string> = {
      draft: "bg-amber-100 text-amber-700",
      published: "bg-green-100 text-green-700",
      offline: "bg-gray-100 text-gray-600",
      archived: "bg-red-100 text-red-600",
    };
    const labels: Record<string, string> = {
      draft: "草稿",
      published: "已发布",
      offline: "已下线",
      archived: "已归档",
    };
    return (
      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${styles[s] || ""}`}>
        {labels[s] || s}
      </span>
    );
  };

  const totalPages = Math.ceil(total / 15);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">FAQ管理</h1>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/faqs/import"
            className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            批量导入
          </Link>
          <Link
            href="/admin/faqs/new"
            className="px-5 py-2.5 bg-primary-600 text-white rounded-full text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            + 新建FAQ
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="搜索..."
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm flex-1 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-primary-500/50"
        />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
        >
          <option value="">全部状态</option>
          <option value="draft">草稿</option>
          <option value="published">已发布</option>
          <option value="offline">已下线</option>
          <option value="archived">已归档</option>
        </select>
        <select
          value={visibility}
          onChange={(e) => { setVisibility(e.target.value); setPage(1); }}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
        >
          <option value="">全部范围</option>
          <option value="public">公开</option>
          <option value="internal">内部</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : faqs.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-400">暂无FAQ</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">标题</th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">分类</th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">范围</th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">浏览</th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">更新</th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {faqs.map((faq) => (
                  <tr key={faq.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <Link href={`/admin/faqs/${faq.id}`} className="text-sm font-medium text-gray-900 hover:text-primary-600 line-clamp-1">
                        {faq.titleZh}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {faq.category?.nameZh || "-"}
                    </td>
                    <td className="px-6 py-4">{statusBadge(faq.status)}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full ${faq.visibility === "public" ? "bg-blue-100 text-blue-600" : "bg-amber-100 text-amber-600"}`}>
                        {faq.visibility === "public" ? "公开" : "内部"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{faq.viewCount}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">{new Date(faq.updatedAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Link href={`/admin/faqs/${faq.id}`} className="text-sm text-primary-600 hover:text-primary-700">
                          编辑
                        </Link>
                        {faq.status === "draft" && (
                          <button onClick={() => updateStatus(faq.id, "published")} className="text-sm text-green-600 hover:text-green-700">
                            发布
                          </button>
                        )}
                        {faq.status === "published" && (
                          <button onClick={() => updateStatus(faq.id, "offline")} className="text-sm text-amber-600 hover:text-amber-700">
                            下线
                          </button>
                        )}
                        <button onClick={() => deleteFaq(faq.id)} className="text-sm text-red-500 hover:text-red-600">
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-6">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-full text-sm border border-gray-200 disabled:opacity-50 hover:bg-gray-50"
          >
            上一页
          </button>
          <span className="text-sm text-gray-500 px-4">{page} / {totalPages}</span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-full text-sm border border-gray-200 disabled:opacity-50 hover:bg-gray-50"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
