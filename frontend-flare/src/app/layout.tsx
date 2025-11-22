import type { Metadata, Viewport } from "next"; // Viewportを追加
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Yorjv",
  description: "Swipe it again!",
  // ★iOSで「ホーム画面に追加」したときにアプリっぽく振る舞う設定
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent", // ステータスバーを背景透過に
    title: "Yorjv",
  },
};

// ★追加: ビューポートとテーマカラー設定
export const viewport: Viewport = {
  themeColor: "#000000", // アドレスバー等の色
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // 勝手なズームを防ぐ（アプリ風にするなら必須）
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* type="image/svg+xml" はSVG用なので、PNGに合わせて修正しました */}
        <link rel="icon" href="/favicon.png" type="image/png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}