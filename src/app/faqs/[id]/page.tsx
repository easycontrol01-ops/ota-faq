"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

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
  relatedFaqs: { id: number; titleZh: string; titleEn: string }[];
}

export default function FAQDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [lang, setLang] = useState<"zh" | "en">("zh");
  const [faq, setFaq] = useState<FAQ | null>(null);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("lang");
    if (saved === "en" || saved === "zh") setLang(saved);

    fetch(`/api/faqs/${resolvedParams.id}`)
      .then((r) => r.json())
      .then((d) => {
        setFaq(d.faq);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [resolvedParams.id]);

  const sendFeedback = async (helpful: boolean) => {
    if (feedbackSent) return;
    await fetch(`/api/faqs/${resolvedParams.id}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ helpful }),
    });
    setFeedbackSent(true);
    if (faq) {
      setFaq({
        ...faq,
        helpfulCount: helpful ? faq.helpfulCount + 1 : faq.helpfulCount,
        notHelpfulCount: helpful ? faq.notHelpfulCount : faq.notHelpfulCount + 1,
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!faq) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-4">😕</div>
            <h2 className="text-base font-medium text-gray-900 mb-2">未找到该文章</h2>
            <Link href="/" className="text-primary-600 hover:text-primary-700 text-sm">← 返回首页</Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const title = lang === "zh" ? faq.titleZh : faq.titleEn;
  const content = lang === "zh" ? faq.contentZh : faq.contentEn;

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa]">
      <Header />

      <article className="max-w-3xl mx-auto px-6 py-8 w-full flex-1">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-400 mb-6">
          <Link href="/" className="hover:text-gray-600">首页</Link>
          {faq.category && (
            <>
              <span>/</span>
              <Link href={`/?categoryId=${faq.category.id}`} className="hover:text-gray-600">{faq.category.nameZh}</Link>
            </>
          )}
        </nav>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100">
            {/* Meta */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`text-[11px] px-2 py-1 rounded-full font-medium ${faq.type === "platform" ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-600"}`}>
                {faq.type === "platform" ? "平台端" : faq.type === "device" ? "设备端" : "其他"}
              </span>
              <span className="text-[11px] px-2 py-1 rounded-full bg-gray-100 text-gray-500">{faq.os}</span>
              {faq.visibility === "internal" && (
                <span className="text-[11px] px-2 py-1 rounded-full bg-amber-50 text-amber-600 font-medium">🔒 内部</span>
              )}
              {faq.tags?.map((tag) => (
                <span key={tag.id} className="text-[11px] text-gray-400">#{tag.name}</span>
              ))}
            </div>

            {/* Title */}
            <h1 className="text-lg font-semibold text-gray-900 leading-snug mb-2">{title}</h1>

            {/* Info */}
            <div className="flex items-center gap-4 text-[11px] text-gray-400">
              <span>👁 {faq.viewCount} 次浏览</span>
              <span>📅 {new Date(faq.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-5">
            <div
              className="text-[13px] text-gray-600 leading-relaxed
                [&_h1]:text-[14px] [&_h1]:font-semibold [&_h1]:text-gray-800 [&_h1]:mt-4 [&_h1]:mb-2
                [&_h2]:text-[13px] [&_h2]:font-semibold [&_h2]:text-gray-800 [&_h2]:mt-4 [&_h2]:mb-2
                [&_h3]:text-[13px] [&_h3]:font-medium [&_h3]:text-gray-700 [&_h3]:mt-3 [&_h3]:mb-1.5
                [&_p]:mb-2 [&_p]:font-normal
                [&_ul]:pl-4 [&_ul]:mb-2 [&_ul]:list-disc
                [&_ol]:pl-4 [&_ol]:mb-2 [&_ol]:list-decimal
                [&_li]:mb-1 [&_li]:font-normal
                [&_strong]:font-medium [&_strong]:text-gray-700
                [&_blockquote]:border-l-2 [&_blockquote]:border-primary-300 [&_blockquote]:pl-3 [&_blockquote]:py-1 [&_blockquote]:my-2 [&_blockquote]:text-gray-500 [&_blockquote]:bg-gray-50 [&_blockquote]:rounded-r
                [&_code]:text-[12px] [&_code]:bg-gray-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-primary-600
                [&_pre]:bg-gray-800 [&_pre]:text-gray-200 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:text-[12px] [&_pre]:my-3 [&_pre]:overflow-x-auto
                [&_pre_code]:bg-transparent [&_pre_code]:p-0
                [&_table]:w-full [&_table]:border-collapse [&_table]:my-3 [&_table]:text-[12px]
                [&_th]:border [&_th]:border-gray-200 [&_th]:bg-gray-50 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-medium
                [&_td]:border [&_td]:border-gray-200 [&_td]:px-3 [&_td]:py-2
                [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-3 [&_img]:outline-none [&_img]:border-0 [&_.img-wrapper]:outline-none [&_.editable-img]:border-0
                [&_a]:text-primary-600 [&_a]:hover:underline
                [&_hr]:my-4 [&_hr]:border-gray-200"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </div>

          {/* Feedback */}
          <div className="px-6 py-5 bg-gray-50 border-t border-gray-100">
            <div className="text-center">
              {feedbackSent ? (
                <div className="inline-flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-full text-[13px]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  感谢您的反馈
                </div>
              ) : (
                <>
                  <p className="text-[13px] text-gray-500 mb-3">这篇文章对您有帮助吗？</p>
                  <div className="flex items-center justify-center gap-3">
                    <button onClick={() => sendFeedback(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-gray-600 rounded-full text-[13px] border border-gray-200 hover:bg-green-50 hover:text-green-600 hover:border-green-200 transition-all">
                      <span>👍</span><span>有帮助</span><span className="text-gray-400">({faq.helpfulCount})</span>
                    </button>
                    <button onClick={() => sendFeedback(false)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-gray-600 rounded-full text-[13px] border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all">
                      <span>👎</span><span>无帮助</span><span className="text-gray-400">({faq.notHelpfulCount})</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Related FAQs */}
        {faq.relatedFaqs && faq.relatedFaqs.length > 0 && (
          <div className="mt-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">相关文章</h2>
            <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
              {faq.relatedFaqs.map((rf) => (
                <Link key={rf.id} href={`/faqs/${rf.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors group">
                  <span className="text-[13px] text-gray-600 group-hover:text-primary-600">{rf.titleZh}</span>
                  <svg className="w-4 h-4 text-gray-300 group-hover:text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>

      <Footer />
    </div>
  );
}
