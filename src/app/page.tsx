"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Logo from "@/components/Logo";
import { marked } from "marked";

interface FAQ {
  id: number;
  titleZh: string;
  titleEn: string;
  contentZh: string;
  contentEn: string;
  viewCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  updatedAt: string;
  publishedAt: string;
  type: string;
  os: string;
  visibility: string;
  category: { id: number; nameZh: string; nameEn: string } | null;
  tags: { id: number; name: string }[];
}

interface Category {
  id: number;
  nameZh: string;
  nameEn: string;
  faqCount: number;
}

interface Tag {
  id: number;
  name: string;
  usageCount: number;
}

// Strip markdown to plain text for preview
function stripMarkdown(md: string): string {
  return md
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`{1,3}[^`]*`{1,3}/g, "")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[(.+?)\]\(.*?\)/g, "$1")
    .replace(/>\s+/g, "")
    .replace(/[-*+]\s+/g, "")
    .replace(/\d+\.\s+/g, "")
    .replace(/\n{2,}/g, " ")
    .replace(/\n/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export default function HomePage() {
  const [lang, setLang] = useState<"zh" | "en">("zh");
  const [user, setUser] = useState<{ id: number; username: string } | null>(null);
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [tagList, setTagList] = useState<Tag[]>([]);
  const [faqList, setFaqList] = useState<FAQ[]>([]);
  const [hotFaqs, setHotFaqs] = useState<FAQ[]>([]);
  const [total, setTotal] = useState(0);
  const [totalViews, setTotalViews] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [categoryId, setCategoryId] = useState("");
  const [type, setType] = useState("");
  const [os, setOs] = useState("");
  const [tagId, setTagId] = useState("");
  const [sort, setSort] = useState("recentUpdate");

  useEffect(() => {
    const saved = localStorage.getItem("lang");
    if (saved === "en" || saved === "zh") setLang(saved);

    fetch("/api/auth/me").then((r) => r.json()).then((d) => setUser(d.user)).catch(() => {});
    fetch("/api/categories").then((r) => r.json()).then((d) => setCategories(d.categories || [])).catch(() => {});
    fetch("/api/tags").then((r) => r.json()).then((d) => setTagList(d.tags || [])).catch(() => {});
    fetch("/api/faqs?sort=mostViewed&limit=5").then((r) => r.json()).then((d) => {
      setHotFaqs(d.faqs || []);
      setTotalViews((d.faqs || []).reduce((s: number, f: FAQ) => s + f.viewCount, 0));
    }).catch(() => {});
  }, []);

  const loadFaqs = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (categoryId) params.set("categoryId", categoryId);
    if (type) params.set("type", type);
    if (os) params.set("os", os);
    if (tagId) params.set("tagId", tagId);
    params.set("sort", sort);
    params.set("page", String(page));
    params.set("limit", String(limit));

    fetch(`/api/faqs?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => { setFaqList(d.faqs || []); setTotal(d.total || 0); setLoading(false); })
      .catch(() => setLoading(false));
  }, [search, categoryId, type, os, tagId, sort, page, limit]);

  useEffect(() => { loadFaqs(); }, [loadFaqs]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); };

  const resetFilters = () => {
    setCategoryId(""); setType(""); setOs(""); setTagId(""); setSort("recentUpdate"); setSearch(""); setPage(1);
  };

  const toggleExpand = (id: number) => { setExpandedId(expandedId === id ? null : id); };

  const hasActiveFilters = categoryId || type || os || tagId || search;
  const totalPages = Math.ceil(total / limit);

  const categoryIcons: Record<string, string> = {
    "OTA升级": "📦", "OTA Upgrade": "📦",
    "设备连接": "🔗", "Device Connection": "🔗",
    "网络异常": "🌐", "Network Issues": "🌐",
    "系统限制": "⚙️", "System Limitations": "⚙️",
    "配置说明": "📝", "Configuration Guide": "📝",
    "常见报错": "⚠️", "Common Errors": "⚠️",
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa]">
      <Header />

      {/* Hero */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-12 text-center">
          <div className="flex justify-center mb-4"><Logo size="large" /></div>
          <p className="text-gray-500 mb-8">
            {lang === "zh" ? "快速查找 OTA 服务相关问题与解答" : "Find answers to OTA service questions"}
          </p>
          <form onSubmit={handleSearch} className="max-w-xl mx-auto">
            <div className="relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder={lang === "zh" ? "搜索问题..." : "Search..."}
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
              />
            </div>
          </form>
          <div className="flex items-center justify-center gap-8 mt-8 text-sm">
            <div className="flex items-center gap-2 text-gray-500">
              <span className="text-lg">📚</span><span><strong className="text-gray-900">{total}</strong> 篇文章</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <span className="text-lg">📂</span><span><strong className="text-gray-900">{categories.length}</strong> 个分类</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <span className="text-lg">👁</span><span><strong className="text-gray-900">{totalViews.toLocaleString()}</strong> 次浏览</span>
            </div>
          </div>
          {!user && (
            <p className="text-xs text-gray-400 mt-4">💡 <Link href="/login" className="text-primary-600 hover:underline">登录</Link> 后可查看内部知识库</p>
          )}
        </div>
      </section>

      {/* Categories */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-5">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button onClick={() => { setCategoryId(""); setPage(1); }}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${!categoryId ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              全部
            </button>
            {categories.map((cat) => (
              <button key={cat.id} onClick={() => { setCategoryId(String(cat.id)); setPage(1); }}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${categoryId === String(cat.id) ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                <span>{categoryIcons[cat.nameZh] || "📁"}</span>
                <span>{lang === "zh" ? cat.nameZh : cat.nameEn}</span>
                <span className={`text-xs ${categoryId === String(cat.id) ? "text-white/70" : "text-gray-400"}`}>{cat.faqCount}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 py-6 w-full flex-1">
        <div className="flex gap-6">
          {/* Main */}
          <div className="flex-1 min-w-0">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500/30">
                <option value="">全部类型</option><option value="platform">平台端</option><option value="device">设备端</option>
              </select>
              <select value={os} onChange={(e) => { setOs(e.target.value); setPage(1); }}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500/30">
                <option value="">全部系统</option><option value="Android">Android</option><option value="RTOS">RTOS</option><option value="Linux">Linux</option><option value="any">不限</option>
              </select>
              <select value={tagId} onChange={(e) => { setTagId(e.target.value); setPage(1); }}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500/30">
                <option value="">全部标签</option>
                {tagList.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
              </select>
              <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500/30">
                <option value="recentUpdate">最新更新</option><option value="newest">最新发布</option><option value="mostViewed">浏览最多</option><option value="mostHelpful">最有帮助</option>
              </select>
              {hasActiveFilters && (
                <button onClick={resetFilters} className="px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 rounded-lg">清除</button>
              )}
              <div className="ml-auto flex items-center gap-2">
                <span className="text-sm text-gray-400">{total} 条结果</span>
                <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                  className="px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30">
                  <option value={15}>每页 15 条</option>
                  <option value={20}>每页 20 条</option>
                  <option value={50}>每页 50 条</option>
                  <option value={100}>每页 100 条</option>
                </select>
              </div>
            </div>

            {/* FAQ List */}
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : faqList.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-gray-500">暂无结果</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
                {faqList.map((faq) => {
                  const content = lang === "zh" ? faq.contentZh : faq.contentEn;
                  const preview = stripMarkdown(content);
                  const isLong = preview.length > 100;
                  const isExpanded = expandedId === faq.id;

                  return (
                    <div key={faq.id} id={`faq-${faq.id}`}>
                      {/* Question + Preview Row */}
                      <div className="px-5 py-3.5">
                        {/* Top: Question */}
                        <div className="flex items-start gap-3">
                          <span className="text-primary-500 mt-0.5 text-sm flex-shrink-0">Q</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Link href={`/faqs/${faq.id}`} className="text-sm font-medium text-gray-900 hover:text-primary-600 transition-colors">
                                {lang === "zh" ? faq.titleZh : faq.titleEn}
                              </Link>
                              {faq.visibility === "internal" && (
                                <span className="text-[11px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 leading-none">内部</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-[12px] text-gray-400 leading-none">
                              <span className={`px-1.5 py-0.5 rounded ${faq.type === "platform" ? "bg-blue-50 text-blue-500" : "bg-green-50 text-green-500"}`}>
                                {faq.type === "platform" ? "平台端" : "设备端"}
                              </span>
                              {faq.category && <span>{faq.category.nameZh}</span>}
                              <span>{faq.os}</span>
                              <span className="hidden sm:inline">👁{faq.viewCount}</span>
                              <span className="hidden sm:inline">👍{faq.helpfulCount}</span>
                            </div>
                          </div>
                        </div>

                        {/* Bottom: Answer Preview */}
                        <div className="ml-6 mt-2">
                          {!isExpanded ? (
                            <div>
                              <p className="text-[13px] text-gray-500 leading-relaxed line-clamp-2">
                                {preview}
                              </p>
                              {isLong && (
                                <button
                                  onClick={() => toggleExpand(faq.id)}
                                  className="mt-1 text-[12px] text-primary-500 hover:text-primary-600 inline-flex items-center gap-0.5"
                                >
                                  展开全文
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          ) : (
                            <div>
                              <div
                                className="text-[13px] text-gray-500 leading-relaxed [&_h1]:text-[13px] [&_h1]:font-medium [&_h1]:text-gray-700 [&_h1]:mt-3 [&_h1]:mb-1 [&_h2]:text-[13px] [&_h2]:font-medium [&_h2]:text-gray-700 [&_h2]:mt-3 [&_h2]:mb-1 [&_h3]:text-[13px] [&_h3]:font-medium [&_h3]:text-gray-700 [&_h3]:mt-2 [&_h3]:mb-1 [&_p]:mb-1.5 [&_p]:text-[13px] [&_p]:font-normal [&_ul]:pl-4 [&_ul]:mb-1.5 [&_ol]:pl-4 [&_ol]:mb-1.5 [&_li]:text-[13px] [&_li]:mb-0.5 [&_li]:font-normal [&_strong]:font-medium [&_strong]:text-gray-600 [&_blockquote]:border-l-2 [&_blockquote]:border-primary-200 [&_blockquote]:pl-3 [&_blockquote]:text-gray-500 [&_blockquote]:my-1.5 [&_code]:text-[12px] [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:rounded [&_pre]:bg-gray-800 [&_pre]:text-gray-200 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:text-[12px] [&_pre]:my-2"
                                dangerouslySetInnerHTML={{ __html: marked.parse(content) as string }}
                              />
                              <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-50">
                                <button
                                  onClick={() => toggleExpand(faq.id)}
                                  className="text-[12px] text-gray-400 hover:text-gray-600 inline-flex items-center gap-0.5"
                                >
                                  收起
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                  </svg>
                                </button>
                                <Link href={`/faqs/${faq.id}`} className="text-[12px] text-primary-500 hover:text-primary-600 inline-flex items-center gap-0.5">
                                  查看详情
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                                  </svg>
                                </Link>
                                <span className="text-[11px] text-gray-300">{new Date(faq.updatedAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6">
                <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                  className="px-4 py-2 rounded-lg text-sm border border-gray-200 bg-white disabled:opacity-40 hover:bg-gray-50">
                  上一页
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pn;
                    if (totalPages <= 5) pn = i + 1;
                    else if (page <= 3) pn = i + 1;
                    else if (page >= totalPages - 2) pn = totalPages - 4 + i;
                    else pn = page - 2 + i;
                    return (
                      <button key={pn} onClick={() => setPage(pn)}
                        className={`w-8 h-8 rounded-lg text-sm ${page === pn ? "bg-primary-600 text-white" : "bg-white border border-gray-200 hover:bg-gray-50"}`}>
                        {pn}
                      </button>
                    );
                  })}
                </div>
                <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
                  className="px-4 py-2 rounded-lg text-sm border border-gray-200 bg-white disabled:opacity-40 hover:bg-gray-50">
                  下一页
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="hidden lg:block w-60 flex-shrink-0 space-y-5">
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span>🔥</span> 热门文章
              </h3>
              <div className="space-y-2">
                {hotFaqs.map((faq, i) => (
                  <button key={faq.id} onClick={() => { setExpandedId(faq.id); document.getElementById(`faq-${faq.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }); }}
                    className="flex items-start gap-2 group text-left w-full">
                    <span className={`w-5 h-5 rounded flex items-center justify-center text-xs font-medium flex-shrink-0 ${i < 3 ? "bg-primary-100 text-primary-600" : "bg-gray-100 text-gray-500"}`}>{i + 1}</span>
                    <span className="text-[13px] text-gray-600 group-hover:text-primary-600 line-clamp-2 leading-snug">{lang === "zh" ? faq.titleZh : faq.titleEn}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span>🏷️</span> 热门标签
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {tagList.slice(0, 12).map((tag) => (
                  <button key={tag.id} onClick={() => { setTagId(tagId === String(tag.id) ? "" : String(tag.id)); setPage(1); }}
                    className={`px-2 py-1 rounded text-xs transition-colors ${tagId === String(tag.id) ? "bg-primary-100 text-primary-700" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-gray-900 rounded-xl p-4 text-white">
              <h3 className="text-sm font-semibold mb-2">没找到答案？</h3>
              <p className="text-xs text-gray-400 mb-3">联系技术支持团队获取帮助</p>
              <a href="mailto:support@ota.com" className="inline-flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300">📧 support@ota.com</a>
            </div>
          </aside>
        </div>
      </div>
      <Footer />
    </div>
  );
}
