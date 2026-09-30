import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WRTBU · 写作工作台",
  description: "通过互动引导与自主修改，练习 IELTS、GRE、TOEFL 写作。",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
