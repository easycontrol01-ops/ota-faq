"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Analytics {
  totalFaqs: number;
  publishedFaqs: number;
  draftFaqs: number;
  totalViews: number;
  topViewed: { id: number; titleZh: string; viewCount: number }[];
  topSearches: { keyword: string; count: number; avgResults: number }[];
  zeroResults: { keyword: string; count: number }[];
  faqHelpRates: { id: number; titleZh: string; helpfulCount: number; notHelpfulCount: number; helpRate: number }[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {});
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-900 mb-8">统计分析</h1>

      {/* Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="text-3xl font-semibold text-gray-900">{data.totalFaqs}</div>
          <div className="text-sm text-gray-500 mt-1">FAQ总数</div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="text-3xl font-semibold text-green-600">{data.publishedFaqs}</div>
          <div className="text-sm text-gray-500 mt-1">已发布</div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="text-3xl font-semibold text-amber-600">{data.draftFaqs}</div>
          <div className="text-sm text-gray-500 mt-1">草稿</div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="text-3xl font-semibold text-primary-600">{data.totalViews.toLocaleString()}</div>
          <div className="text-sm text-gray-500 mt-1">总浏览量</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Viewed */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-medium text-gray-900">📊 浏览量排行</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {data.topViewed.map((faq, i) => (
              <Link key={faq.id} href={`/admin/faqs/${faq.id}`} className="flex items-center px-6 py-4 hover:bg-gray-50 transition-colors">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mr-4 ${i < 3 ? "bg-primary-100 text-primary-700" : "bg-gray-100 text-gray-500"}`}>
                  {i + 1}
                </span>
                <span className="flex-1 text-sm text-gray-700 truncate">{faq.titleZh}</span>
                <span className="text-sm text-gray-400 ml-4">{faq.viewCount}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Top Searches */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-medium text-gray-900">🔍 热门搜索词</h2>
          </div>
          {data.topSearches.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">暂无搜索数据</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {data.topSearches.map((item, i) => (
                <div key={i} className="flex items-center px-6 py-4">
                  <span className="flex-1 text-sm text-gray-700">{item.keyword}</span>
                  <span className="text-sm text-gray-400">{item.count}次搜索</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Zero Results */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-medium text-gray-900">⚠️ 无结果搜索词</h2>
            <p className="text-xs text-gray-400 mt-1">这些关键词搜索无结果，可能需要补充相关FAQ</p>
          </div>
          {data.zeroResults.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">暂无数据</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {data.zeroResults.map((item, i) => (
                <div key={i} className="flex items-center px-6 py-4">
                  <span className="flex-1 text-sm text-gray-700">{item.keyword}</span>
                  <span className="text-sm text-red-500">{item.count}次</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Help Rates */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-medium text-gray-900">👎 低帮助率文章</h2>
            <p className="text-xs text-gray-400 mt-1">这些文章帮助率较低，可能需要优化</p>
          </div>
          {data.faqHelpRates.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">暂无反馈数据</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {data.faqHelpRates.map((faq) => (
                <Link key={faq.id} href={`/admin/faqs/${faq.id}`} className="flex items-center px-6 py-4 hover:bg-gray-50 transition-colors">
                  <span className="flex-1 text-sm text-gray-700 truncate">{faq.titleZh}</span>
                  <div className="flex items-center space-x-3 ml-4">
                    <span className="text-xs text-green-600">👍 {faq.helpfulCount}</span>
                    <span className="text-xs text-red-500">👎 {faq.notHelpfulCount}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${faq.helpRate >= 70 ? "bg-green-100 text-green-700" : faq.helpRate >= 40 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                      {faq.helpRate}%
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
