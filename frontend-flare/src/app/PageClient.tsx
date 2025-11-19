"use client";

import { useState } from "react";
import VideoFeed from "./components/VideoFeed";
import { Button } from "./components/ui/Button";
import UploadModal from "./components/UploadModal";
import type { User } from "@supabase/supabase-js";

interface PageClientProps {
  user: User;
}

// Icons
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

export default function PageClient({ user }: PageClientProps) {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  return (
    <div className="w-full h-screen bg-black flex flex-col">
      {/* Modern Header with Blur Effect */}
      <header className="fixed top-0 left-0 w-full z-20 border-b border-white/10 bg-black/50 backdrop-blur-md">
        <div className="w-full max-w-4xl mx-auto flex justify-between items-center px-4 h-16">
          {/* Logo Area */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">R</span>
            </div>
            <div className="font-bold text-xl text-white tracking-tight">
              RiceSwipe
            </div>
          </div>

          {/* Actions Area */}
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setIsUploadModalOpen(true)}
              variant="default"
              size="sm"
              className="hidden sm:flex items-center gap-2 bg-white text-black hover:bg-gray-200 border-0 font-semibold"
            >
              <UploadIcon />
              <span>Upload</span>
            </Button>
            
            {/* Mobile Upload Icon Button */}
            <Button
              onClick={() => setIsUploadModalOpen(true)}
              variant="ghost"
              size="sm"
              className="sm:hidden text-white hover:bg-white/10"
            >
              <UploadIcon />
            </Button>

            <div className="h-6 w-px bg-white/20 mx-1" />

            <div className="flex items-center gap-2">
              <span className="hidden md:inline text-sm text-gray-300 mr-2">
                {user.email}
              </span>
              <form action="/auth/signout" method="post">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white hover:bg-white/10"
                  title="Sign out"
                >
                  <LogOutIcon />
                  <span className="sr-only">Logout</span>
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full h-full pt-16">
        <VideoFeed />
      </main>

      {/* Upload Modal Overlay */}
      {isUploadModalOpen && (
        <UploadModal onClose={() => setIsUploadModalOpen(false)} />
      )}
    </div>
  );
}