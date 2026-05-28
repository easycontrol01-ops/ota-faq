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
  const [userList, setUserList] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("employee");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Reset password modal
  const [resetUserId, setResetUserId] = useState<number | null>(null);
  const [resetUsername, setResetUsername] = useState("");
  const [tempPassword, setTempPassword] = useState("");

  const loadUsers = () => {
    fetch("/api/users").then(r => r.json()).then(d => setUserList(d.users || [])).catch(() => {});
  };

  useEffect(() => { loadUsers(); }, []);

  const resetForm = () => {
    setUsername(""); setEmail(""); setPassword(""); setRole("employee"); setShowForm(false); setError("");
  };

  // Generate random temp password
  const generateTempPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    let pwd = "";
    for (let i = 0; i < 8; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pwd;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!username || !email || !password) { setError("请填写所有字段"); return; }
    if (password.length < 6) { setError("密码至少6位"); return; }

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password, role, tempPassword: true }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "创建失败"); return; }

    setSuccess(`用户 ${username} 创建成功！初始密码：${password}`);
    resetForm();
    loadUsers();
  };

  const handleResetPassword = async () => {
    if (!resetUserId) return;
    setError(""); setSuccess("");

    const pwd = tempPassword || generateTempPassword();

    const res = await fetch(`/api/users/${resetUserId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pwd, tempPassword: true }),
    });

    if (res.ok) {
      setSuccess(`用户 ${resetUsername} 的密码已重置为：${pwd}（临时密码，用户登录后需自行修改）`);
      setResetUserId(null);
      setResetUsername("");
      setTempPassword("");
    } else {
      setError("重置失败，请重试");
    }
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
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">用户管理</h1>
        <button onClick={() => { resetForm(); setShowForm(true); setError(""); setSuccess(""); setPassword(generateTempPassword()); }}
          className="px-4 py-2 bg-primary-600 text-white rounded-full text-sm font-medium hover:bg-primary-700">
          + 新建用户
        </button>
      </div>

      {/* Messages */}
      {error && <div className="bg-red-50 text-red-600 rounded-xl p-3 mb-4 text-sm">❌ {error}</div>}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
          <p className="text-sm text-green-700">✅ {success}</p>
          <p className="text-xs text-green-600 mt-1">💡 请将密码告知用户，用户首次登录后会被要求修改密码</p>
        </div>
      )}

      {/* Create User Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          <h2 className="text-sm font-medium text-gray-900 mb-4">新建用户</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">用户名 *</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                placeholder="设置用户名" required />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">邮箱 *</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                placeholder="用户邮箱" required />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">初始密码 *</label>
              <div className="flex gap-2">
                <input type="text" value={password} onChange={e => setPassword(e.target.value)}
                  className="flex-1 px-3 py-2.5 bg-gray-50 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                  placeholder="初始密码（至少6位）" required />
                <button type="button" onClick={() => setPassword(generateTempPassword())}
                  className="px-3 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs hover:bg-gray-200 flex-shrink-0">
                  随机生成
                </button>
              </div>
              <p className="text-[11px] text-gray-400 mt-1">用户首次登录后会被要求修改密码</p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">角色</label>
              <select value={role} onChange={e => setRole(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30">
                <option value="employee">员工</option>
                <option value="admin">管理员</option>
              </select>
            </div>
            <div className="col-span-2 flex gap-3 mt-2">
              <button type="submit" className="px-5 py-2.5 bg-primary-600 text-white rounded-full text-sm font-medium hover:bg-primary-700">
                创建用户
              </button>
              <button type="button" onClick={resetForm} className="px-5 py-2.5 text-gray-500 hover:text-gray-700">取消</button>
            </div>
          </form>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetUserId && (
        <div className="bg-white rounded-2xl border border-amber-200 p-6 mb-6">
          <h2 className="text-sm font-medium text-gray-900 mb-2">🔑 重置密码 — {resetUsername}</h2>
          <p className="text-xs text-gray-500 mb-4">为该用户设置新的临时密码，用户登录后需自行修改</p>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1.5">新临时密码</label>
              <div className="flex gap-2">
                <input type="text" value={tempPassword} onChange={e => setTempPassword(e.target.value)}
                  className="flex-1 px-3 py-2.5 bg-gray-50 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                  placeholder="输入新密码或点击随机生成" />
                <button type="button" onClick={() => setTempPassword(generateTempPassword())}
                  className="px-3 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs hover:bg-gray-200 flex-shrink-0">
                  随机生成
                </button>
              </div>
            </div>
            <button onClick={handleResetPassword}
              className="px-5 py-2.5 bg-amber-600 text-white rounded-full text-sm font-medium hover:bg-amber-700">
              确认重置
            </button>
            <button onClick={() => { setResetUserId(null); setTempPassword(""); }}
              className="px-4 py-2.5 text-gray-500 hover:text-gray-700 text-sm">取消</button>
          </div>
        </div>
      )}

      {/* User Table */}
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
            {userList.map(u => (
              <tr key={u.id} className="hover:bg-gray-50/50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{u.username}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{u.email}</td>
                <td className="px-6 py-4">
                  <select value={u.role} onChange={e => changeRole(u.id, e.target.value)}
                    className="text-xs px-2 py-1 rounded-lg bg-gray-50 border-0">
                    <option value="employee">员工</option>
                    <option value="admin">管理员</option>
                  </select>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${u.disabled ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"}`}>
                    {u.disabled ? "已禁用" : "正常"}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setResetUserId(u.id); setResetUsername(u.username); setTempPassword(generateTempPassword()); setError(""); setSuccess(""); }}
                      className="text-sm text-primary-600 hover:text-primary-700">
                      重置密码
                    </button>
                    <button onClick={() => toggleDisabled(u.id, u.disabled)}
                      className={`text-sm ${u.disabled ? "text-green-600 hover:text-green-700" : "text-amber-600 hover:text-amber-700"}`}>
                      {u.disabled ? "启用" : "禁用"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Help */}
      <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">💡 用户管理说明</h3>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• 由管理员统一创建账号，不支持用户自助注册</li>
          <li>• 创建用户时系统会自动生成临时密码，请将密码告知用户</li>
          <li>• 用户使用临时密码首次登录后，系统会要求修改密码</li>
          <li>• 如用户忘记密码，管理员可点击「重置密码」生成新的临时密码</li>
          <li>• 员工角色可以浏览内部FAQ、提交FAQ（需审核）</li>
          <li>• 管理员角色可以管理所有内容、审核FAQ、管理用户</li>
        </ul>
      </div>
    </div>
  );
}
