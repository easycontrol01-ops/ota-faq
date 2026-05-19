"use client";

import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <Logo />
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} OTA Services. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
