import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "OTA FAQ Knowledge Base",
  description: "OTA Service FAQ Knowledge Base - Find answers to common questions",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-slate-800 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
