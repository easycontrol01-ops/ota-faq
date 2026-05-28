"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import PasswordInput from "@/components/PasswordInput";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  

  const [showChangePass, setShowChangePass] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [newPass, setNewPass] = useState("");
  const [newPass2, setNewPass2] = useState("");
  const [forgotUser, setForgotUser] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetResult, setResetResult] = useState("");
  const [showMaster, setShowMaster] = useState(false);
  const [masterKey, setMasterKey] = useState("");
  const [masterUser, setMasterUser] = useState("");
  const [masterResult, setMasterResult] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => { if (d.user) window.location.replace("/admin"); })
      .catch(() => {});
  }, []);

  const goAdmin = () => { window.location.assign("/admin"); };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);     try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "登录失败"); setLoading(false); return; }
      if (data.requirePasswordChange) { setShowChangePass(true); setLoading(false); return; }
      window.location.assign("/admin");
      return;
    } catch { setError("网络错误"); setLoading(false); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    if (newPass.length < 6) { setError("新密码至少6位"); setLoading(false); return; }
    if (newPass !== newPass2) { setError("两次密码输入不一致"); setLoading(false); return; }
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: newPass }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "修改失败"); setLoading(false); return; }
      window.location.assign("/admin");
      return;
    } catch { setError("网络错误"); setLoading(false); }
  };

  const inputClass = "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all";

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-10">
          <Link href="/"><Logo size="large" /></Link>
        </div>

        <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 text-center mb-6">
              {showMaster ? "安全口令重置" : showChangePass ? "修改密码" : showForgot ? "邮箱重置" : "登录"}
            </h2>

            {error && <div className="bg-red-50 text-red-600 rounded-xl p-3 mb-4 text-sm text-center">{error}</div>}
            

            {showForgot ? (
              <form onSubmit={async (e) => {
                e.preventDefault(); setError(""); setLoading(true);
                try {
                  const res = await fetch("/api/auth/forgot-password", {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username: forgotUser, email: forgotEmail }),
                  });
                  const data = await res.json();
                  if (!res.ok) { setError(data.error || "重置失败"); setLoading(false); return; }
                  setResetResult(data.newPassword);
                } catch { setError("网络错误"); }
                setLoading(false);
              }} className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">用户名</label>
                  <input type="text" value={forgotUser} onChange={e => setForgotUser(e.target.value)}
                    className={inputClass} placeholder="请输入用户名" required />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">注册邮箱</label>
                  <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                    className={inputClass} placeholder="请输入注册时使用的邮箱" required />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-all disabled:opacity-50 text-sm">
                  {loading ? "重置中..." : "重置密码"}
                </button>
                {resetResult && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-center">
                    <p className="text-green-700 font-medium">新密码：{resetResult}</p>
                    <p className="text-green-600 text-xs mt-1">请复制保存，然后返回登录</p>
                  </div>
                )}
                <button type="button" onClick={() => { setShowForgot(false); setError(""); setResetResult(""); }}
                  className="w-full py-2 text-sm text-gray-500 hover:text-gray-700">返回登录</button>
              </form>
            ) : showMaster ? (
              <form onSubmit={async (e) => {
                e.preventDefault(); setError(""); setMasterResult(""); setLoading(true);
                try {
                  const res = await fetch("/api/auth/master-reset", {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ resetKey: masterKey, username: masterUser }),
                  });
                  const data = await res.json();
                  if (!res.ok) { setError(data.error || "重置失败"); setLoading(false); return; }
                  setMasterResult(data.message);
                } catch { setError("网络错误"); }
                setLoading(false);
              }} className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">安全重置口令</label>
                  <input type="text" value={masterKey} onChange={e => setMasterKey(e.target.value)}
                    className={inputClass} placeholder="请输入安全重置口令" required />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">用户名</label>
                  <input type="text" value={masterUser} onChange={e => setMasterUser(e.target.value)}
                    className={inputClass} placeholder="请输入要重置的用户名" required />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3 bg-amber-600 text-white font-medium rounded-xl hover:bg-amber-700 transition-all disabled:opacity-50 text-sm">
                  {loading ? "重置中..." : "重置密码"}
                </button>
                {masterResult && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-center">
                    <p className="text-green-700">{masterResult}</p>
                  </div>
                )}
                <button type="button" onClick={() => { setShowMaster(false); setError(""); setMasterResult(""); }}
                  className="w-full py-2 text-sm text-gray-500 hover:text-gray-700">返回登录</button>
              </form>
            ) : !showChangePass ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">用户名</label>
                  <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                    className={inputClass} placeholder="请输入用户名" required />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">密码</label>
                  <PasswordInput value={password} onChange={e => setPassword(e.target.value)}
                    className={inputClass + " pr-10"} placeholder="请输入密码" required />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-all disabled:opacity-50 text-sm">
                  {loading ? "登录中..." : "登录"}
                </button>
                
              </form>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="bg-amber-50 text-amber-700 rounded-xl p-3 text-sm">
                  ⚠️ 您的密码为管理员分配的临时密码，请设置新密码后继续使用。
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">新密码</label>
                  <PasswordInput value={newPass} onChange={e => setNewPass(e.target.value)}
                    className={inputClass + " pr-10"} placeholder="设置新密码（至少6位）" required />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">确认新密码</label>
                  <PasswordInput value={newPass2} onChange={e => setNewPass2(e.target.value)}
                    className={inputClass + " pr-10"} placeholder="再次输入新密码" required />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-all disabled:opacity-50 text-sm">
                  {loading ? "修改中..." : "确认修改"}
                </button>
                
                <button type="button" onClick={() => { setShowChangePass(false); setError(""); }}
                  className="w-full py-2 text-sm text-gray-500 hover:text-gray-700">返回登录</button>
              </form>
            )}
          </div>

          {!showChangePass && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
              <button onClick={() => { setError(""); setShowMaster(true); setShowChangePass(false); }}
                className="text-xs text-gray-400 hover:text-primary-600 transition-colors text-center w-full">
                忘记密码？通过安全口令重置
              </button>
            </div>
          )}
        </div>

        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">← 返回首页</Link>
        </div>
      </div>
    </div>
  );
}
