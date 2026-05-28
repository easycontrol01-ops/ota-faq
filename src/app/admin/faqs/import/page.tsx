"use client";

import { useState } from "react";
import Link from "next/link";

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

interface ImportResult {
  success: boolean;
  total: number;
  imported: number;
  errors: ValidationError[];
}

export default function ImportFAQsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith(".xlsx") || droppedFile.name.endsWith(".xls")) {
        setFile(droppedFile);
        setResult(null);
      } else {
        alert("请上传 Excel 文件 (.xlsx 或 .xls)");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const downloadTemplate = () => {
    window.location.href = "/api/faqs/template";
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/faqs/import", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({
        success: false,
        total: 0,
        imported: 0,
        errors: [{ row: 0, field: "系统", message: "网络错误，请重试" }],
      });
    }
    setUploading(false);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">批量导入 FAQ</h1>
        <Link href="/admin/faqs" className="text-sm text-gray-500 hover:text-gray-700">
          ← 返回列表
        </Link>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-6">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">📋 导入说明</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• 请先下载模板，按照模板格式填写数据</li>
          <li>• <strong>标题</strong> 和 <strong>内容</strong> 为必填项，不能为空</li>
          <li>• 内容支持 Markdown 格式</li>
          <li>• 标签请使用英文逗号分隔，不存在的标签会自动创建</li>
          <li>• 导入后的FAQ状态默认为"草稿"，需在列表中手动发布</li>
          <li>• <strong>重复标题的FAQ将自动跳过</strong>，不会重复导入</li>
        </ul>
        <div className="mt-3 pt-3 border-t border-blue-200">
          <h4 className="text-xs font-semibold text-blue-800 mb-1">文件限制</h4>
          <ul className="text-xs text-blue-600 space-y-0.5">
            <li>• 格式：.xlsx 或 .xls</li>
            <li>• 大小：最大 5MB</li>
            <li>• 行数：最多 500 条</li>
            <li>• 标题：最长 500 字</li>
            <li>• 内容：最长 50,000 字</li>
          </ul>
        </div>
      </div>

      {/* Download Template */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">第一步：下载模板</h3>
            <p className="text-sm text-gray-500 mt-1">下载 Excel 模板文件，按格式填写FAQ数据</p>
          </div>
          <button
            onClick={downloadTemplate}
            className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            下载模板
          </button>
        </div>
      </div>

      {/* Upload Area */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">第二步：上传文件</h3>
        
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            dragActive ? "border-primary-500 bg-primary-50" : "border-gray-200 hover:border-gray-300"
          }`}
        >
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <button
                onClick={() => { setFile(null); setResult(null); }}
                className="ml-4 text-gray-400 hover:text-red-500"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p className="text-sm text-gray-600 mb-2">拖拽文件到此处，或</p>
              <label className="inline-block px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium cursor-pointer hover:bg-primary-700 transition-colors">
                选择文件
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-gray-400 mt-2">支持 .xlsx, .xls 格式</p>
            </>
          )}
        </div>

        {file && (
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="mt-4 w-full py-3 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                导入中...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                开始导入
              </>
            )}
          </button>
        )}
      </div>

      {/* Result */}
      {result && (
        <div className={`rounded-2xl border p-6 ${result.success && result.errors.length === 0 ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"}`}>
          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${result.success && result.errors.length === 0 ? "bg-green-100" : "bg-red-100"}`}>
              {result.success && result.errors.length === 0 ? (
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <h3 className={`text-sm font-semibold ${result.success && result.errors.length === 0 ? "text-green-900" : "text-red-900"}`}>
                {result.success && result.errors.length === 0 ? "导入成功" : "导入完成（存在错误）"}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                共 {result.total} 条数据，成功导入 {result.imported} 条
                {(result as unknown as {skipped?: number}).skipped ? `，跳过 ${(result as unknown as {skipped: number}).skipped} 条（重复）` : ""}
                {result.errors.length > 0 && `，${result.errors.length} 条提示`}
              </p>

              {result.errors.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-xs font-semibold text-red-800 mb-2">错误详情：</h4>
                  <div className="bg-white rounded-lg border border-red-200 divide-y divide-red-100 max-h-48 overflow-y-auto">
                    {result.errors.map((err, i) => (
                      <div key={i} className="px-3 py-2 text-sm">
                        <span className="text-red-600 font-medium">第 {err.row} 行</span>
                        <span className="text-gray-500 mx-2">·</span>
                        <span className="text-gray-600">{err.field}</span>
                        <span className="text-gray-500 mx-2">·</span>
                        <span className="text-red-700">{err.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.imported > 0 && (
                <Link
                  href="/admin/faqs"
                  className="inline-flex items-center gap-1 mt-4 text-sm text-primary-600 hover:text-primary-700"
                >
                  查看已导入的FAQ →
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
