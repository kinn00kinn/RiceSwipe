// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// import { Header } from "@/components/layouts/Header"; // ★ インポート
import { Header } from "@/src/components/layouts/Header"; // ★ インポート


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RiceSwipe", // ★ タイトル変更
  description: "A new video platform", // ★ 説明変更
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      {" "}
      {/* ★ 言語を ja に変更 */}
      <body className={inter.className}>
        <div className="relative flex min-h-screen flex-col">
          <Header /> {/* ★ Header をここに追加 */}
          <main className="flex-1">
            {children} {/* ★ 各ページの内容がここに入ります */}
          </main>
          {/* TODO: フッターやナビゲーションをここに追加 */}
        </div>
      </body>
    </html>
  );
}
