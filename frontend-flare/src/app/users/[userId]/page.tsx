"use client";

import React, { useEffect, useState, use } from "react"; // 1. Import 'use'
import Link from "next/link";

interface VideoSummary {
  id: string;
  title: string;
}

interface UserProfile {
  id: string;
  name: string;
  videos: VideoSummary[];
  likedVideos: VideoSummary[];
  stats: {
    posts: number;
    likes: number;
  };
}

const GridIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M10 3H4a1 1 0 00-1 1v6a1 1 0 001 1h6a1 1 0 001-1V4a1 1 0 00-1-1zM9 9H5V5h4v4zm13-6h-6a1 1 0 00-1 1v6a1 1 0 001 1h6a1 1 0 001-1V4a1 1 0 00-1-1zm-1 6h-4V5h4v4zm-9 4H4a1 1 0 00-1 1v6a1 1 0 001 1h6a1 1 0 001-1v-6a1 1 0 00-1-1zm-1 6H5v-4h4v4zm8-6h-6a1 1 0 00-1 1v6a1 1 0 001 1h6a1 1 0 001-1v-6a1 1 0 00-1-1zm-1 6h-4v-4h4v4z" />
  </svg>
);

const HeartIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.5l1.318-1.182a4.5 4.5 0 116.364 6.364L12 21l-7.682-7.318a4.5 4.5 0 010-6.364z"
    />
  </svg>
);

export default function UserProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>; // 2. Type params as Promise
}) {
  const { userId } = use(params); // 3. Unwrap params with use()
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<"videos" | "likes">("videos");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/users/${userId}`);
        if (res.ok) {
          const data = (await res.json()) as UserProfile;
          setUser(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [userId]);

  if (loading)
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-gray-500">
        Loading...
      </div>
    );
  if (!user)
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        User not found
      </div>
    );

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Header Info */}
      <div className="pt-12 pb-6 px-4 flex flex-col items-center border-b border-gray-800">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 border-2 border-black flex items-center justify-center text-3xl mb-3">
          {user.name?.[0]?.toUpperCase() || "U"}
        </div>
        <h1 className="text-xl font-bold mb-1">@{user.name || "User"}</h1>

        <div className="flex gap-8 mt-4 text-center">
          <div className="flex flex-col">
            <span className="font-bold text-lg">{user.stats.posts}</span>
            <span className="text-xs text-gray-400">Posts</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg">{user.stats.likes}</span>
            <span className="text-xs text-gray-400">Likes</span>
          </div>
        </div>

        <div className="flex gap-2 mt-6 w-full max-w-xs">
          <button className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md text-sm transition-colors">
            Follow
          </button>
          <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-md text-white transition-colors">
            Message
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex sticky top-0 bg-black/95 z-10 backdrop-blur-md border-b border-gray-800">
        <button
          onClick={() => setActiveTab("videos")}
          className={`flex-1 py-3 flex items-center justify-center transition-colors ${
            activeTab === "videos"
              ? "text-white border-b-2 border-white"
              : "text-gray-500 hover:text-gray-300"
          }`}
        >
          <GridIcon />
        </button>
        <button
          onClick={() => setActiveTab("likes")}
          className={`flex-1 py-3 flex items-center justify-center transition-colors ${
            activeTab === "likes"
              ? "text-white border-b-2 border-white"
              : "text-gray-500 hover:text-gray-300"
          }`}
        >
          <HeartIcon />
        </button>
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-3 gap-0.5">
        {activeTab === "videos" ? (
          user.videos.length > 0 ? (
            user.videos.map((video) => (
              <Link
                href={`/?videoId=${video.id}`}
                key={video.id}
                className="aspect-[3/4] bg-gray-900 relative block hover:opacity-90 transition-opacity"
              >
                <div className="absolute inset-0 flex items-center justify-center text-[10px] text-gray-500 p-2 text-center break-words">
                  {video.title}
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-3 py-20 text-center text-gray-500 text-sm">
              No videos posted
            </div>
          )
        ) : user.likedVideos.length > 0 ? (
          user.likedVideos.map((video) => (
            <Link
              href={`/?videoId=${video.id}`}
              key={video.id}
              className="aspect-[3/4] bg-gray-900 relative block hover:opacity-90 transition-opacity"
            >
              <div className="absolute inset-0 flex items-center justify-center text-[10px] text-gray-500 p-2 text-center break-words">
                {video.title}
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-3 py-20 text-center text-gray-500 text-sm">
            No liked videos yet
          </div>
        )}
      </div>
    </div>
  );
}