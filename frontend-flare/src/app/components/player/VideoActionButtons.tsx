"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Heart,
  Share2,
  Link as LinkIcon,
  Volume2,
  VolumeX,
  MoreVertical,
  Upload,
  LogOut,
  Bookmark,
  Plus,
} from "lucide-react";

interface VideoActionButtonsProps {
  video: {
    author?: {
      id: string;
      name: string;
    };
  };
  isLiked: boolean;
  likeCount: number;
  onLike: (e: React.MouseEvent) => void;
  onOpenAddToList: (e: React.MouseEvent) => void;
  originalUrl?: string | null;
  onShare: (e: React.MouseEvent) => void;
  isMuted: boolean;
  onToggleMute: (e: React.MouseEvent) => void;
  onUploadRequest: () => void;
}

const VideoActionButtons = React.memo(
  ({
    video,
    isLiked,
    likeCount,
    onLike,
    onOpenAddToList,
    originalUrl,
    onShare,
    isMuted,
    onToggleMute,
    onUploadRequest,
  }: VideoActionButtonsProps) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const getValidUrl = (url: string) => {
      if (!url) return "";
      if (url.startsWith("http://") || url.startsWith("https://")) return url;
      return `https://${url}`;
    };

    const toggleMenu = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsMenuOpen(!isMenuOpen);
    };

    return (
      <div className="flex flex-col items-center gap-5 pointer-events-auto pb-24 min-w-[50px] relative">
        {/* Avatar Placeholder */}
        <div className="relative">
          {video.author ? (
            <Link
              href={`/users/${video.author.id}`}
              onClick={(e) => e.stopPropagation()} // 動画クリックイベントの伝播を防止
              className="block"
            >
              <div className="w-10 h-10 rounded-full bg-gray-700 border-2 border-white overflow-hidden flex items-center justify-center hover:scale-105 transition-transform relative">
                {/* ユーザー画像の代わりにイニシャルを表示 */}
                <span className="text-white font-bold text-sm">
                  {video.author.name[0].toUpperCase()}
                </span>
              </div>
              {/* フォローボタン（+マーク） */}
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-red-500 w-5 h-5 rounded-full flex items-center justify-center border border-white">
                <Plus className="w-3 h-3 text-white" strokeWidth={4} />
              </div>
            </Link>
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
              <span className="text-gray-400 text-xs">?</span>
            </div>
          )}
        </div>

        {/* Like */}
        <button
          onClick={onLike}
          className="flex flex-col items-center group gap-1"
        >
          <div className="transform transition-transform duration-200 active:scale-75 group-hover:scale-110">
            <Heart
              className={`w-8 h-8 drop-shadow-lg transition-colors ${
                isLiked ? "fill-red-500 text-red-500" : "text-white"
              }`}
              strokeWidth={isLiked ? 0 : 2}
            />
          </div>
          <span className="text-white text-xs font-bold drop-shadow-md">
            {likeCount}
          </span>
        </button>

        {/* Add to List (Save) Button */}
        <button
          onClick={onOpenAddToList}
          className="flex flex-col items-center group gap-1"
        >
          <div className="transform transition-transform duration-200 active:scale-75 group-hover:scale-110">
            <Bookmark className="w-8 h-8 text-white drop-shadow-lg" />
          </div>
          <span className="text-white text-xs font-bold drop-shadow-md">
            Save
          </span>
        </button>

        {/* Link */}
        {originalUrl && (
          <a
            href={getValidUrl(originalUrl)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex flex-col items-center group gap-1"
          >
            <div className="p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors active:scale-90">
              <LinkIcon className="w-6 h-6 text-white drop-shadow-md" />
            </div>
            <span className="text-white text-xs font-medium drop-shadow-md">
              Link
            </span>
          </a>
        )}

        {/* Share */}
        <button
          onClick={onShare}
          className="flex flex-col items-center group gap-1"
        >
          <div className="transform transition-transform duration-200 active:scale-90 group-hover:rotate-12">
            <Share2 className="w-7 h-7 text-white drop-shadow-md" />
          </div>
          <span className="text-white text-xs font-medium drop-shadow-md">
            Share
          </span>
        </button>

        {/* Volume */}
        <button
          onClick={onToggleMute}
          className="p-2 rounded-full hover:bg-black/20 transition-colors mt-2 active:scale-90"
        >
          {isMuted ? (
            <VolumeX className="w-7 h-7 text-white drop-shadow-md" />
          ) : (
            <Volume2 className="w-7 h-7 text-white drop-shadow-md" />
          )}
        </button>

        {/* Menu Button */}
        <div className="relative">
          <button
            onClick={toggleMenu}
            className={`p-2 rounded-full transition-colors mt-2 active:scale-90 ${
              isMenuOpen ? "bg-white/20" : "hover:bg-black/20"
            }`}
          >
            <MoreVertical className="w-7 h-7 text-white drop-shadow-md" />
          </button>

          {/* Popup Menu */}
          {isMenuOpen && (
            <div className="absolute bottom-full right-12 mb-[-20px] flex flex-col gap-2 bg-black/80 backdrop-blur-md p-2 rounded-xl border border-white/10 min-w-[140px] animate-in fade-in zoom-in duration-200 origin-bottom-right">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(false);
                  onUploadRequest();
                }}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 text-white text-sm transition-colors w-full text-left"
              >
                <Upload className="w-5 h-5" />
                <span>Upload</span>
              </button>
              <form action="/auth/signout" method="post" className="w-full">
                <button
                  type="submit"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-500/20 text-red-400 hover:text-red-300 text-sm transition-colors w-full text-left"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </form>
            </div>
          )}
        </div>

        {isMenuOpen && (
          <div
            className="fixed inset-0 z-[-1]"
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(false);
            }}
          />
        )}
      </div>
    );
  }
);

VideoActionButtons.displayName = "VideoActionButtons";

export default VideoActionButtons;