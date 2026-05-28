"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import Logo from "./Logo";

interface User {
  id: number;
  username: string;
  role: string;
}

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [lang, setLang] = useState<"zh" | "en">("zh");
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("lang");
    if (saved === "en" || saved === "zh") setLang(saved);
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user))
      .catch(() => {});

    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleLang = () => {
    const next = lang === "zh" ? "en" : "zh";
    setLang(next);
    localStorage.setItem("lang", next);
    window.location.reload();
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    window.location.href = "/";
  };

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/80 backdrop-blur-xl shadow-sm" : "bg-white/60 backdrop-blur-md"} border-b border-gray-100`}>
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex items-center justify-between h-14">
          <Link href="/">
            <Logo />
          </Link>

          {/* Desktop */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link href="/" className="px-4 py-2 rounded-full text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 transition-all">
              {lang === "zh" ? "首页FAQ" : "FAQ"}
            </Link>
            <Link href="/docs" className="px-4 py-2 rounded-full text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 transition-all">
              {lang === "zh" ? "文档中心" : "Docs"}
            </Link>
            {user && (
              <Link href="/admin" className="px-4 py-2 rounded-full text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 transition-all">
                {lang === "zh" ? "管理后台" : "Admin"}
              </Link>
            )}
            <button onClick={toggleLang} className="px-4 py-2 rounded-full text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100/80 transition-all">
              {lang === "zh" ? "EN" : "中文"}
            </button>
            <div className="w-px h-5 bg-gray-200 mx-2" />
            {user ? (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {user.username}
                  <span className="ml-1.5 text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    {user.role === "admin" ? (lang === "zh" ? "管理员" : "Admin") : (lang === "zh" ? "员工" : "Staff")}
                  </span>
                </span>
                <button onClick={logout} className="px-4 py-1.5 rounded-full text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100/80 transition-all">
                  {lang === "zh" ? "退出" : "Logout"}
                </button>
              </div>
            ) : (
              <Link href="/login" className="px-5 py-1.5 rounded-full text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition-all">
                {lang === "zh" ? "登录" : "Login"}
              </Link>
            )}
          </nav>

          {/* Mobile */}
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-full hover:bg-gray-100">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 8h16M4 16h16"} />
            </svg>
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100 space-y-1">
            <Link href="/" className="block px-4 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-100">
              {lang === "zh" ? "首页" : "Home"}
            </Link>
            {user && (
              <Link href="/admin" className="block px-4 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-100">
                {lang === "zh" ? "管理后台" : "Admin"}
              </Link>
            )}
            <button onClick={toggleLang} className="block w-full text-left px-4 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-100">
              {lang === "zh" ? "Switch to English" : "切换到中文"}
            </button>
            <div className="pt-2 mt-2 border-t border-gray-100">
              {user ? (
                <>
                  <div className="px-4 py-2 text-sm text-gray-500">👤 {user.username}</div>
                  <button onClick={logout} className="block w-full text-left px-4 py-2.5 rounded-xl text-sm text-red-600 hover:bg-red-50">
                    {lang === "zh" ? "退出登录" : "Logout"}
                  </button>
                </>
              ) : (
                <Link href="/login" className="block px-4 py-2.5 rounded-xl text-sm font-medium text-primary-600 hover:bg-primary-50">
                  {lang === "zh" ? "登录" : "Login"}
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
