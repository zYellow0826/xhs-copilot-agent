import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "小红书运营 Copilot",
  description: "给单人店铺老板用的小红书内容生成 + 账号诊断工具",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
