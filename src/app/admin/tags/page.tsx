"use client";

import { useState, useEffect } from "react";

interface Tag {
  id: number;
  name: string;
  usageCount: number;
}

export default function AdminTagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [name, setName] = useState("");

  const loadTags = () => {
    fetch("/api/tags")
      .then((r) => r.json())
      .then((d) => setTags(d.tags || []))
      .catch(() => {});
  };

  useEffect(() => {
    loadTags();
  }, []);

  const resetForm = () => {
    setName("");
    setEditId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    if (editId) {
      await fetch(`/api/tags/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
    } else {
      await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
    }
    resetForm();
    loadTags();
  };

  const startEdit = (tag: Tag) => {
    setEditId(tag.id);
    setName(tag.name);
    setShowForm(true);
  };

  const deleteTag = async (id: number) => {
    if (!confirm("确认删除该标签？")) return;
    await fetch(`/api/tags/${id}`, { method: "DELETE" });
    loadTags();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">标签管理</h1>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="px-5 py-2.5 bg-primary-600 text-white rounded-full text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          + 新建标签
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          <form onSubmit={handleSubmit} className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-2">标签名称</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                placeholder="输入标签名称"
                required
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

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex flex-wrap gap-3">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="group flex items-center space-x-2 px-4 py-2.5 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors"
            >
              <span className="text-sm text-gray-700">{tag.name}</span>
              <span className="text-xs text-gray-400 bg-gray-200/80 px-2 py-0.5 rounded-full">
                {tag.usageCount}
              </span>
              <div className="hidden group-hover:flex items-center space-x-1 ml-1 border-l border-gray-200 pl-2">
                <button
                  onClick={() => startEdit(tag)}
                  className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                >
                  ✏️
                </button>
                <button
                  onClick={() => deleteTag(tag.id)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
          {tags.length === 0 && (
            <p className="text-sm text-gray-400">暂无标签</p>
          )}
        </div>
      </div>
    </div>
  );
}
