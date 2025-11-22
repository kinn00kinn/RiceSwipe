// frontend-flare/src/app/search/page.tsx
"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

// --- Icons (簡易コンポーネント) ---
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
const HashtagIcon = () => <span className="text-blue-400 mr-1">#</span>;

// --- Components ---

// 1. 検索バー
function SearchBar({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const [term, setTerm] = useState(initialQuery);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (term.trim()) {
      router.push(`/search?q=${encodeURIComponent(term)}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative w-full">
      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
        <SearchIcon />
      </div>
      <input
        type="text"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="動画、タグ、リストを検索..."
        className="w-full bg-gray-900 border border-gray-800 text-white rounded-full py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder-gray-500"
      />
    </form>
  );
}

// 2. 発見（ディスカバリー）ビュー：検索前のおすすめ表示
function DiscoveryView() {
  // 将来的にはAPIから取得しますが、今はダミーデータでUIを作ります
  const trendingTags = [
    "RiceCooking",
    "EggFriedRice",
    "ASMR",
    "Bento",
    "LateNightSnack",
  ];
  const popularLists = [
    { id: "1", title: "🏆 Best Rice 2024", count: 12 },
    { id: "2", title: "🍳 Easy Recipes", count: 8 },
    { id: "3", title: "🌧️ Rainy Day Mood", count: 5 },
  ];

  return (
    <div className="space-y-8 p-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* トレンドハッシュタグ */}
      <section>
        <h3 className="text-lg font-bold text-white mb-3 flex items-center">
          Trending Hashtags{" "}
          <span className="ml-2 text-xs text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full">
            Live
          </span>
        </h3>
        <div className="flex flex-wrap gap-2">
          {trendingTags.map((tag) => (
            <Link
              key={tag}
              href={`/search?q=%23${tag}`} // #タグとして検索
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-full text-sm font-medium transition-colors border border-gray-700 flex items-center"
            >
              <HashtagIcon /> {tag}
            </Link>
          ))}
        </div>
      </section>

      {/* おすすめのリスト (将来機能) */}
      <section>
        <h3 className="text-lg font-bold text-white mb-3">Featured Lists</h3>
        <div className="grid grid-cols-2 gap-3">
          {popularLists.map((list) => (
            <div
              key={list.id}
              className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 rounded-xl border border-gray-700/50 hover:border-gray-500 transition-colors cursor-pointer group"
            >
              <div className="h-20 bg-gray-700/30 rounded-lg mb-3 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                🍚
              </div>
              <h4 className="font-bold text-white text-sm truncate">
                {list.title}
              </h4>
              <p className="text-xs text-gray-400 mt-1">{list.count} videos</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// 3. 検索結果ビュー
function SearchResults({ query }: { query: string }) {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          // const data = await res.json();
          const data = (await res.json()) as { videos: any[] };
          setResults(data.videos || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [query]);

  if (loading) {
    return (
      <div className="flex justify-center pt-20">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center text-gray-500 pt-20">
        <p>No videos found for "{query}"</p>
      </div>
    );
  }

  return (
    <div className="p-2">
      <h3 className="text-white mb-4 px-2 text-sm font-medium text-gray-400">
        Results for "{query}"
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {results.map((video: any) => (
          <Link
            href={`/?videoId=${video.id}`}
            key={video.id}
            className="relative aspect-[9/16] bg-gray-900 rounded-lg overflow-hidden group"
          >
            {/* サムネイル代わりのプレースホルダー (実際は動画サムネ等) */}
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
              <span className="text-xs text-gray-600">Video</span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex flex-col justify-end p-3">
              <p className="text-sm font-bold text-white truncate">
                {video.title}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <div className="w-4 h-4 rounded-full bg-gray-500" />
                <p className="text-xs text-gray-300 truncate">
                  {video.author?.name || "Unknown"}
                </p>
              </div>
              {/* ハッシュタグがあれば表示 */}
              {video.hashtags && video.hashtags.length > 0 && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {video.hashtags.slice(0, 2).map((t: any) => (
                    <span
                      key={t.id}
                      className="text-[10px] text-blue-300 bg-blue-900/30 px-1.5 py-0.5 rounded"
                    >
                      #{t.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// --- Main Page Component ---

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-md p-4 border-b border-white/10">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <Link
            href="/"
            className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <BackIcon />
          </Link>
          <SearchBar initialQuery={query} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-2xl mx-auto w-full">
        {query ? <SearchResults query={query} /> : <DiscoveryView />}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white" />}>
      <SearchContent />
    </Suspense>
  );
}
