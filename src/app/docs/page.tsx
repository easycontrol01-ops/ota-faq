"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Logo from "@/components/Logo";

interface Doc {
  id: number;
  titleZh: string;
  contentZh: string;
  visibility: string;
  viewCount: number;
  updatedAt: string;
}

interface ExtractedFile {
  src: string;
  filename: string;
  filesize: string;
  filetype: string;
}

function extractImageUrls(html: string): string[] {
  const urls: string[] = [];
  const regex = /<img[^>]+src="([^"]+)"/g;
  let m;
  while ((m = regex.exec(html)) !== null) {
    urls.push(m[1]);
  }
  return urls;
}

function extractFiles(html: string): ExtractedFile[] {
  const files: ExtractedFile[] = [];
  const regex = /data-file-attachment[^>]*>/g;
  const srcRegex = /src="([^"]+)"/;
  const nameRegex = /filename="([^"]+)"/;
  const sizeRegex = /filesize="([^"]+)"/;
  const typeRegex = /filetype="([^"]+)"/;
  let block;
  while ((block = regex.exec(html)) !== null) {
    const blockText = block[0];
    const src = srcRegex.exec(blockText)?.[1] || "";
    const filename = nameRegex.exec(blockText)?.[1] || "";
    const filesize = sizeRegex.exec(blockText)?.[1] || "";
    const filetype = typeRegex.exec(blockText)?.[1] || "";
    files.push({ src, filename, filesize, filetype });
  }
  return files;
}

function isPreviewable(ext: string): boolean {
  const previewable = ["TXT", "CSV", "JPG", "JPEG", "PNG", "GIF", "WEBP"];
  return previewable.includes(ext.toUpperCase());
}

export default function DocsPage() {
  const [lang, setLang] = useState<"zh" | "en">("zh");
  const [user, setUser] = useState<{ id: number } | null>(null);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => setUser(d.user)).catch(() => {});
    fetch("/api/faqs?type=other&sort=recentUpdate&limit=50")
      .then(r => r.json())
      .then(d => { setDocs(d.faqs || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa]">
      <Header />
      
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-12 text-center">
          <div className="flex justify-center mb-4"><Logo size="large" /></div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight mb-2">
            {lang === "zh" ? "文档中心" : "Document Center"}
          </h1>
          <p className="text-gray-500 text-sm">
            {lang === "zh" ? "产品手册 · 操作指南 · 技术规范" : "Manuals · Guides · Specifications"}
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 py-8 w-full flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : docs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <div className="text-5xl mb-4">📁</div>
            <p className="text-gray-500">{lang === "zh" ? "暂无文档" : "No documents yet"}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {docs.filter(d => d.visibility === "public" || user).map(doc => {
              const files = extractFiles(doc.contentZh);
              const images = extractImageUrls(doc.contentZh);
              const isExpanded = expandedId === doc.id;

              return (
                <div key={doc.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <button
                    onClick={() => toggleExpand(doc.id)}
                    className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-gray-50 transition-colors group"
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${isExpanded ? "bg-primary-100 text-primary-600" : "bg-blue-50 text-blue-500"}`}>
                      <svg className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors">{doc.titleZh}</h3>
                      <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                        <span>📎 {files.length} 个附件</span>
                        <span>🖼 {images.length} 个图片</span>
                        <span>👁 {doc.viewCount} 次查看</span>
                        <span>{new Date(doc.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-6 pb-6 border-t border-gray-100 pt-4">
                      {images.length > 0 && (
                        <div className="space-y-3 mb-4">
                          {images.map((url, i) => (
                            <div key={i} className="bg-gray-50 rounded-xl p-3">
                              <img src={url} alt={`image-${i}`} className="max-w-full rounded-lg max-h-96 object-contain" />
                            </div>
                          ))}
                        </div>
                      )}

                      {files.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">📎 附件列表</h4>
                          {files.map((file, i) => {
                            const canPreview = isPreviewable(file.filetype);
                            return (
                              <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0 border border-gray-100 text-xl">
                                  {canPreview ? "👁" : "📄"}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm font-medium text-gray-900 truncate">{file.filename}</div>
                                  <div className="text-xs text-gray-400 mt-0.5">{file.filetype} · {file.filesize}</div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {canPreview && (
                                    <a href={file.src} target="_blank" rel="noopener noreferrer"
                                      className="px-4 py-2 bg-primary-600 text-white rounded-full text-xs font-medium hover:bg-primary-700 transition-colors">
                                      👁 {lang === "zh" ? "在线查看" : "Preview"}
                                    </a>
                                  )}
                                  <a href={file.src} download={file.filename}
                                    className={`px-4 py-2 ${canPreview ? "bg-gray-100 text-gray-700 hover:bg-gray-200" : "bg-primary-600 text-white hover:bg-primary-700"} rounded-full text-xs font-medium transition-colors`}>
                                    📥 {lang === "zh" ? "下载" : "Download"}
                                  </a>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {files.length === 0 && images.length === 0 && (
                        <p className="text-sm text-gray-400 text-center py-4">{lang === "zh" ? "暂无附件" : "No attachments"}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
