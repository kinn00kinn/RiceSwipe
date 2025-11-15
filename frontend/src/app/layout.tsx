// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/src/components/layouts/Header";
import BottomNavigation from "@/src/components/layouts/BottomNavigation";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RiceSwipe",
  description: "A new video platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${inter.className} bg-gray-50`}>
        <div className="relative flex min-h-screen flex-col">
          <Header />
          <main className="flex-1 pt-16 pb-16">
            <div className="container mx-auto max-w-md px-4 py-8">
              {children}
            </div>
          </main>
          <BottomNavigation />
        </div>
      </body>
    </html>
  );
}
