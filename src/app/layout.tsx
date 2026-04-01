import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "青海高考报考教练",
  description: "基于2025年青海省招生计划数据的AI对话式报考助手",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            const theme = localStorage.getItem('gaokao-theme');
            if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
              document.documentElement.classList.add('dark');
            }
          } catch {}
        `}} />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
