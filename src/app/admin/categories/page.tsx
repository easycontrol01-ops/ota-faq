"use client";

import { useState, useEffect } from "react";

interface Category {
  id: number;
  nameZh: string;
  nameEn: string;
  sortOrder: number;
  faqCount: number;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [nameZh, setNameZh] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [sortOrder, setSortOrder] = useState(0);

  const loadCategories = () => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
      .catch(() => {});
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const resetForm = () => {
    setNameZh("");
    setNameEn("");
    setSortOrder(0);
    setEditId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameZh || !nameEn) return;

    if (editId) {
      await fetch(`/api/categories/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nameZh, nameEn, sortOrder }),
      });
    } else {
      await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nameZh, nameEn, sortOrder }),
      });
    }
    resetForm();
    loadCategories();
  };

  const startEdit = (cat: Category) => {
    setEditId(cat.id);
    setNameZh(cat.nameZh);
    setNameEn(cat.nameEn);
    setSortOrder(cat.sortOrder);
    setShowForm(true);
  };

  const deleteCategory = async (id: number) => {
    if (!confirm("确认删除该分类？")) return;
    await fetch(`/api/categories/${id}`, { method: "DELETE" });
    loadCategories();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">分类管理</h1>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="px-5 py-2.5 bg-primary-600 text-white rounded-full text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          + 新建分类
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          <h2 className="text-sm font-medium text-gray-900 mb-4">
            {editId ? "编辑分类" : "新建分类"}
          </h2>
          <form onSubmit={handleSubmit} className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs text-gray-500 mb-2">中文名称</label>
              <input
                type="text"
                value={nameZh}
                onChange={(e) => setNameZh(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                required
              />
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs text-gray-500 mb-2">English Name</label>
              <input
                type="text"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                required
              />
            </div>
            <div className="w-24">
              <label className="block text-xs text-gray-500 mb-2">排序</label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              />
            </div>
            <button type="submit" className="px-5 py-2.5 bg-primary-600 text-white rounded-full text-sm font-medium hover:bg-primary-700">
              {editId ? "更新" : "创建"}
            </button>
            <button type="button" onClick={resetForm} className="px-5 py-2.5 text-gray-500 hover:text-gray-700">
              取消
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left px-6 py-4 text-xs font-medium text-gray-500">排序</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-gray-500">中文名称</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-gray-500">English Name</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-gray-500">FAQ数量</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-gray-50/50">
                <td className="px-6 py-4 text-sm text-gray-400">{cat.sortOrder}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{cat.nameZh}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{cat.nameEn}</td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">{cat.faqCount}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <button onClick={() => startEdit(cat)} className="text-sm text-primary-600 hover:text-primary-700">
                      编辑
                    </button>
                    <button onClick={() => deleteCategory(cat.id)} className="text-sm text-red-500 hover:text-red-600">
                      删除
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
