"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface FAQ {
  id: number;
  titleZh: string;
  titleEn: string;
  viewCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  updatedAt: string;
  publishedAt: string;
  type: string;
  os: string;
  visibility: string;
  status: string;
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

function FAQListContent() {
  const searchParams = useSearchParams();
  const [lang, setLang] = useState<"zh" | "en">("zh");
  const [faqList, setFaqList] = useState<FAQ[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tagList, setTagList] = useState<Tag[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [categoryId, setCategoryId] = useState(searchParams.get("categoryId") || "");
  const [type, setType] = useState(searchParams.get("type") || "");
  const [os, setOs] = useState(searchParams.get("os") || "");
  const [tagId, setTagId] = useState(searchParams.get("tagId") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "recentUpdate");

  useEffect(() => {
    const saved = localStorage.getItem("lang");
    if (saved === "en" || saved === "zh") setLang(saved);

    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
      .catch(() => {});
    fetch("/api/tags")
      .then((r) => r.json())
      .then((d) => setTagList(d.tags || []))
      .catch(() => {});
  }, []);

  const loadFaqs = useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (categoryId) params.set("categoryId", categoryId);
    if (type) params.set("type", type);
    if (os) params.set("os", os);
    if (tagId) params.set("tagId", tagId);
    params.set("sort", sort);
    params.set("page", String(page));
    params.set("limit", "12");

    fetch(`/api/faqs?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        setFaqList(d.faqs || []);
        setTotal(d.total || 0);
      })
      .catch(() => {});
  }, [search, categoryId, type, os, tagId, sort, page]);

  useEffect(() => {
    loadFaqs();
  }, [loadFaqs]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadFaqs();
  };

  const totalPages = Math.ceil(total / 12);

  const typeLabel = (t: string) => {
    if (lang === "zh") return t === "platform" ? "平台端" : "设备端";
    return t === "platform" ? "Platform" : "Device";
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 w-full flex-1">
        {/* Search & Filter Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 mb-6">
          <form onSubmit={handleSearch} className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={lang === "zh" ? "搜索FAQ..." : "Search FAQs..."}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <button type="submit" className="px-5 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors">
              {lang === "zh" ? "搜索" : "Search"}
            </button>
          </form>

          <div className="flex flex-wrap gap-3">
            <select
              value={categoryId}
              onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">{lang === "zh" ? "全部分类" : "All Categories"}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{lang === "zh" ? c.nameZh : c.nameEn}</option>
              ))}
            </select>

            <select
              value={type}
              onChange={(e) => { setType(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">{lang === "zh" ? "全部类型" : "All Types"}</option>
              <option value="platform">{lang === "zh" ? "平台端" : "Platform"}</option>
              <option value="device">{lang === "zh" ? "设备端" : "Device"}</option>
            </select>

            <select
              value={os}
              onChange={(e) => { setOs(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">{lang === "zh" ? "全部系统" : "All OS"}</option>
              <option value="Android">Android</option>
              <option value="RTOS">RTOS</option>
              <option value="Linux">Linux</option>
              <option value="any">{lang === "zh" ? "不限" : "Any"}</option>
            </select>

            <select
              value={tagId}
              onChange={(e) => { setTagId(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">{lang === "zh" ? "全部标签" : "All Tags"}</option>
              {tagList.map((t) => (
                <option key={t.id} value={t.id}>{t.name} ({t.usageCount})</option>
              ))}
            </select>

            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="recentUpdate">{lang === "zh" ? "最新更新" : "Recent Update"}</option>
              <option value="newest">{lang === "zh" ? "最新发布" : "Newest"}</option>
              <option value="mostViewed">{lang === "zh" ? "浏览最多" : "Most Viewed"}</option>
              <option value="mostHelpful">{lang === "zh" ? "帮助率最高" : "Most Helpful"}</option>
            </select>
          </div>
        </div>

        {/* Results */}
        <div className="mb-4 text-sm text-slate-500">
          {lang === "zh" ? `共 ${total} 条结果` : `${total} results found`}
        </div>

        {faqList.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-16 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <p className="text-slate-500">{lang === "zh" ? "暂无结果" : "No results found"}</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {faqList.map((faq) => (
              <Link
                key={faq.id}
                href={`/faqs/${faq.id}`}
                className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:border-primary-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${faq.type === "platform" ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-600"}`}>
                    {typeLabel(faq.type)}
                  </span>
                  <span className="text-xs text-slate-400">{faq.os}</span>
                </div>
                <h3 className="font-semibold text-slate-800 group-hover:text-primary-600 transition-colors mb-3 line-clamp-2">
                  {lang === "zh" ? faq.titleZh : faq.titleEn}
                </h3>
                <div className="flex flex-wrap gap-1 mb-3">
                  {faq.tags?.slice(0, 3).map((tag) => (
                    <span key={tag.id} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">
                      #{tag.name}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center">👁 {faq.viewCount}</span>
                    <span className="flex items-center">👍 {faq.helpfulCount}</span>
                  </div>
                  {faq.category && (
                    <span className="px-2 py-0.5 bg-primary-50 text-primary-600 rounded-full">
                      {lang === "zh" ? faq.category.nameZh : faq.category.nameEn}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 mt-8">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg text-sm border border-slate-200 disabled:opacity-50 hover:bg-primary-50 transition-colors"
            >
              {lang === "zh" ? "上一页" : "Previous"}
            </button>
            <span className="text-sm text-slate-500">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-lg text-sm border border-slate-200 disabled:opacity-50 hover:bg-primary-50 transition-colors"
            >
              {lang === "zh" ? "下一页" : "Next"}
            </button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default function FAQListPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>}>
      <FAQListContent />
    </Suspense>
  );
}
