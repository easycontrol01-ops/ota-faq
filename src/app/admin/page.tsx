"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Analytics {
  totalFaqs: number;
  publishedFaqs: number;
  draftFaqs: number;
  totalViews: number;
  topViewed: { id: number; titleZh: string; titleEn: string; viewCount: number }[];
  topSearches: { keyword: string; count: number }[];
  faqHelpRates: { id: number; titleZh: string; helpfulCount: number; notHelpfulCount: number; helpRate: number }[];
}

export default function AdminDashboard() {
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

  // Calculate percentages for charts
  const totalForChart = data.totalFaqs || 1;
  const publishedPercent = Math.round((data.publishedFaqs / totalForChart) * 100);
  const draftPercent = Math.round((data.draftFaqs / totalForChart) * 100);
  const otherPercent = 100 - publishedPercent - draftPercent;

  // Get max views for bar chart scaling
  const maxViews = Math.max(...data.topViewed.map(f => f.viewCount), 1);

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-900 mb-8">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-semibold text-gray-900">{data.totalFaqs}</div>
              <div className="text-sm text-gray-500 mt-1">FAQ总数</div>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📚</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-semibold text-green-600">{data.publishedFaqs}</div>
              <div className="text-sm text-gray-500 mt-1">已发布</div>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-semibold text-amber-600">{data.draftFaqs}</div>
              <div className="text-sm text-gray-500 mt-1">草稿</div>
            </div>
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📝</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-semibold text-primary-600">{data.totalViews.toLocaleString()}</div>
              <div className="text-sm text-gray-500 mt-1">总浏览量</div>
            </div>
            <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center">
              <span className="text-2xl">👁</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Pie Chart - FAQ Status Distribution */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-medium text-gray-900 mb-6">📊 FAQ状态分布</h2>
          <div className="flex items-center justify-center gap-8">
            {/* Simple CSS Pie Chart */}
            <div className="relative w-32 h-32">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                {/* Background circle */}
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="3" />
                {/* Published - Green */}
                <circle 
                  cx="18" cy="18" r="15.9" fill="none" 
                  stroke="#22c55e" strokeWidth="3"
                  strokeDasharray={`${publishedPercent} ${100 - publishedPercent}`}
                  strokeDashoffset="0"
                />
                {/* Draft - Amber */}
                <circle 
                  cx="18" cy="18" r="15.9" fill="none" 
                  stroke="#f59e0b" strokeWidth="3"
                  strokeDasharray={`${draftPercent} ${100 - draftPercent}`}
                  strokeDashoffset={`${-publishedPercent}`}
                />
                {/* Other - Gray */}
                {otherPercent > 0 && (
                  <circle 
                    cx="18" cy="18" r="15.9" fill="none" 
                    stroke="#9ca3af" strokeWidth="3"
                    strokeDasharray={`${otherPercent} ${100 - otherPercent}`}
                    strokeDashoffset={`${-(publishedPercent + draftPercent)}`}
                  />
                )}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-semibold text-gray-900">{data.totalFaqs}</span>
              </div>
            </div>
            {/* Legend */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm text-gray-600">已发布 ({data.publishedFaqs})</span>
                <span className="text-sm font-medium text-gray-900">{publishedPercent}%</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span className="text-sm text-gray-600">草稿 ({data.draftFaqs})</span>
                <span className="text-sm font-medium text-gray-900">{draftPercent}%</span>
              </div>
              {otherPercent > 0 && (
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                  <span className="text-sm text-gray-600">其他</span>
                  <span className="text-sm font-medium text-gray-900">{otherPercent}%</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bar Chart - Top Viewed */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-medium text-gray-900 mb-6">📈 浏览量排行</h2>
          <div className="space-y-4">
            {data.topViewed.slice(0, 5).map((faq, i) => (
              <div key={faq.id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <Link href={`/admin/faqs/${faq.id}`} className="text-gray-700 hover:text-primary-600 truncate flex-1 mr-4">
                    <span className={`inline-flex items-center justify-center w-5 h-5 rounded text-xs mr-2 ${i < 3 ? "bg-primary-100 text-primary-700" : "bg-gray-100 text-gray-500"}`}>
                      {i + 1}
                    </span>
                    {faq.titleZh}
                  </Link>
                  <span className="text-gray-500 flex-shrink-0">{faq.viewCount}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${i === 0 ? "bg-primary-500" : i === 1 ? "bg-primary-400" : i === 2 ? "bg-primary-300" : "bg-gray-300"}`}
                    style={{ width: `${(faq.viewCount / maxViews) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Searches */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-medium text-gray-900">🔍 热门搜索词</h2>
          </div>
          {data.topSearches.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">暂无搜索数据</div>
          ) : (
            <div className="p-4">
              <div className="flex flex-wrap gap-2">
                {data.topSearches.slice(0, 10).map((item, i) => (
                  <span 
                    key={i} 
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-50 rounded-full text-sm"
                    style={{ fontSize: `${Math.max(12, Math.min(16, 12 + item.count))}px` }}
                  >
                    <span className="text-gray-700">{item.keyword}</span>
                    <span className="text-xs text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded-full">{item.count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Help Rates - Horizontal Bar Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-medium text-gray-900">👍 反馈帮助率</h2>
          </div>
          {data.faqHelpRates.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">暂无反馈数据</div>
          ) : (
            <div className="p-4 space-y-3">
              {data.faqHelpRates.slice(0, 5).map((faq) => (
                <Link key={faq.id} href={`/admin/faqs/${faq.id}`} className="block group">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-700 group-hover:text-primary-600 truncate flex-1 mr-4">{faq.titleZh}</span>
                    <span className={`font-medium ${faq.helpRate >= 70 ? "text-green-600" : faq.helpRate >= 40 ? "text-amber-600" : "text-red-500"}`}>
                      {faq.helpRate}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
                    <div 
                      className="h-full bg-green-500 transition-all"
                      style={{ width: `${faq.helpRate}%` }}
                    />
                    <div 
                      className="h-full bg-red-400 transition-all"
                      style={{ width: `${100 - faq.helpRate}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>👍 {faq.helpfulCount}</span>
                    <span>👎 {faq.notHelpfulCount}</span>
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
