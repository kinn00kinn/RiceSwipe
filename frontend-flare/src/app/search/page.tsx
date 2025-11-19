"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

// Icons
const BackIcon = () => (
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
      d="M15 19l-7-7 7-7"
    />
  </svg>
);

const SearchIcon = () => (
  <svg
    className="w-5 h-5 text-gray-400"
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

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const doSearch = async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        // ここで型アサーションを追加しました
        setResults(data as any[]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Debounce search or search on submit
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query) doSearch(query);
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Search Header */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-md p-4 flex items-center gap-3 border-b border-white/10">
        <Link
          href="/"
          className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <BackIcon />
        </Link>
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <SearchIcon />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search videos..."
            className="w-full bg-gray-900 border border-gray-800 text-white rounded-full py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder-gray-500"
            autoFocus
          />
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 p-2">
        {loading ? (
          <div className="flex justify-center pt-20">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {results.map((video) => (
              <Link
                href={`/?videoId=${video.id}`} // Note: Main feed needs to support jumping to video, or just link to standalone page
                key={video.id}
                className="relative aspect-[9/16] bg-gray-900 rounded-lg overflow-hidden group"
              >
                {/* Assuming we don't have thumbnails generated yet, we use a video tag paused at 0s or a placeholder */}
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                  <span className="text-xs text-gray-500">Video</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3">
                  <p className="text-sm font-bold truncate">{video.title}</p>
                  <p className="text-xs text-gray-300 truncate">
                    {video.author?.name}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : query ? (
          <div className="text-center text-gray-500 pt-20">
            No results found
          </div>
        ) : (
          <div className="text-center text-gray-500 pt-20">
            <p className="text-lg">RiceSwipe Search</p>
            <p className="text-sm mt-2">Find your favorite rice moments</p>
          </div>
        )}
      </div>
    </div>
  );
}
