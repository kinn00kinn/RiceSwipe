"use client";

import { useState } from "react";
import VideoFeed from "./components/VideoFeed";
import UploadModal from "./components/UploadModal";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";

interface PageClientProps {
  user: User;
}

// Icons
const PlusIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const UploadIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" x2="12" y1="3" y2="15" />
  </svg>
);

const LogOutIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" x2="9" y1="12" y2="12" />
  </svg>
);

const SearchIcon = () => (
  <svg
    className="w-6 h-6 text-white"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

export default function PageClient({ user }: PageClientProps) {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleUploadClick = () => {
    setIsMenuOpen(false);
    setIsUploadModalOpen(true);
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-sans">
      {/* Top Header Overlay */}
      <header className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-4 bg-gradient-to-b from-black/70 to-transparent pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* App Logo / Brand */}
          <img src="./header.jpg" alt="RiceSwipe" className="h-10 center" />
        </div>

        {/* Search Button */}
        <Link
          href="/search"
          className="pointer-events-auto p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <SearchIcon />
        </Link>
      </header>

      <main className="w-full h-full">
        <VideoFeed />
      </main>

      {/* Action Menu Backdrop (closes menu when clicking outside) */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px] transition-opacity duration-200"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Floating Action Button & Menu */}
      <div className="fixed bottom-12 right-5 z-50 flex flex-col items-end gap-4 pb-safe">
        {/* Menu Items */}
        <div
          className={`flex flex-col items-end gap-3 transition-all duration-200 ${
            isMenuOpen
              ? "opacity-100 translate-y-0 scale-100"
              : "opacity-0 translate-y-10 scale-90 pointer-events-none"
          }`}
        >
          {/* Logout Button */}
          <div className="flex items-center gap-3">
            <span className="text-white text-sm font-medium bg-black/50 px-2 py-1 rounded backdrop-blur-sm shadow-sm">
              Logout
            </span>
            <form action="/auth/signout" method="post">
              <button
                className="w-12 h-12 rounded-full bg-gray-800 text-gray-200 hover:bg-gray-700 hover:text-white shadow-lg flex items-center justify-center border border-white/10 transition-colors"
                title="Sign out"
              >
                <LogOutIcon />
              </button>
            </form>
          </div>

          {/* Upload Button */}
          <div className="flex items-center gap-3">
            <span className="text-white text-sm font-medium bg-black/50 px-2 py-1 rounded backdrop-blur-sm shadow-sm">
              Upload
            </span>
            <button
              onClick={handleUploadClick}
              className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 text-white hover:brightness-110 shadow-lg shadow-blue-900/50 flex items-center justify-center border border-white/10 transition-colors"
              title="Upload Video"
            >
              <UploadIcon />
            </button>
          </div>
        </div>

        {/* Main Toggle Button */}
        <button
          onClick={toggleMenu}
          className={`w-14 h-14 rounded-full bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)] flex items-center justify-center transition-transform duration-300 z-50 ${
            isMenuOpen
              ? "rotate-[135deg] bg-gray-200"
              : "rotate-0 hover:scale-105"
          }`}
          title={isMenuOpen ? "Close Menu" : "Open Menu"}
        >
          <PlusIcon />
        </button>
      </div>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <UploadModal onClose={() => setIsUploadModalOpen(false)} />
      )}
    </div>
  );
}
