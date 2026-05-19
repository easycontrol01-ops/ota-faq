"use client";

import { useState, useEffect } from "react";

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  disabled: boolean;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("employee");

  const loadUsers = () => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((d) => setUsers(d.users || []))
      .catch(() => {});
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const resetForm = () => {
    setUsername("");
    setEmail("");
    setPassword("");
    setRole("employee");
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password, role }),
    });
    resetForm();
    loadUsers();
  };

  const toggleDisabled = async (id: number, disabled: boolean) => {
    await fetch(`/api/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ disabled: !disabled }),
    });
    loadUsers();
  };

  const changeRole = async (id: number, newRole: string) => {
    await fetch(`/api/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    loadUsers();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">用户管理</h1>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="px-5 py-2.5 bg-primary-600 text-white rounded-full text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          + 新建用户
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          <h2 className="text-sm font-medium text-gray-900 mb-4">新建用户</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-2">用户名</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-2">邮箱</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-2">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-2">角色</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              >
                <option value="employee">员工</option>
                <option value="admin">管理员</option>
              </select>
            </div>
            <div className="col-span-2 flex gap-3 mt-2">
              <button type="submit" className="px-5 py-2.5 bg-primary-600 text-white rounded-full text-sm font-medium hover:bg-primary-700">
                创建用户
              </button>
              <button type="button" onClick={resetForm} className="px-5 py-2.5 text-gray-500 hover:text-gray-700">
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left px-6 py-4 text-xs font-medium text-gray-500">用户名</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-gray-500">邮箱</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-gray-500">角色</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-gray-500">状态</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-gray-500">创建时间</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50/50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{user.username}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{user.email}</td>
                <td className="px-6 py-4">
                  <select
                    value={user.role}
                    onChange={(e) => changeRole(user.id, e.target.value)}
                    className="text-xs px-2 py-1 rounded-lg bg-gray-50 border-0"
                  >
                    <option value="employee">员工</option>
                    <option value="admin">管理员</option>
                  </select>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${user.disabled ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"}`}>
                    {user.disabled ? "已禁用" : "正常"}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-400">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => toggleDisabled(user.id, user.disabled)}
                    className={`text-sm ${user.disabled ? "text-green-600 hover:text-green-700" : "text-amber-600 hover:text-amber-700"}`}
                  >
                    {user.disabled ? "启用" : "禁用"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
