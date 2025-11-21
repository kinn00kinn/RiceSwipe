"use client";

import { useState } from "react";
import VideoFeed from "./components/VideoFeed";
import UploadModal from "./components/UploadModal";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";

interface PageClientProps {
  user: User;
}

// SearchIconのみ残す
const SearchIcon = () => (
  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

export default function PageClient({ user }: PageClientProps) {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // メニュー開閉の状態管理(isMenuOpen)は不要になったので削除

  const handleUploadClick = () => {
    setIsUploadModalOpen(true);
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-sans">
      {/* Top Header */}
      <header className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-4 bg-gradient-to-b from-black/70 to-transparent pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <img src="./header.jpg" alt="RiceSwipe" className="h-10 center" />
        </div>
        <Link
          href="/search"
          className="pointer-events-auto p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <SearchIcon />
        </Link>
      </header>

      <main className="w-full h-full">
        {/* ここで関数を渡す */}
        <VideoFeed onUploadRequest={handleUploadClick} />
      </main>

      {/* FABとメニューのコードはすべて削除 */}

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <UploadModal onClose={() => setIsUploadModalOpen(false)} />
      )}
    </div>
  );
}