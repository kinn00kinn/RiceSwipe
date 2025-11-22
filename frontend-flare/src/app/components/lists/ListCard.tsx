"use client";

import Link from "next/link";

interface ListCardProps {
  id: string;
  name: string;
  isPublic: boolean;
  videoCount: number;
}

export default function ListCard({
  id,
  name,
  isPublic,
  videoCount,
}: ListCardProps) {
  return (
    <Link
      href={`/lists/${id}`} // 将来的にリスト詳細ページへ遷移
      className="block group relative bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-600 transition-all duration-300"
    >
      {/* サムネイル部分 (将来的にリスト内の動画サムネを表示可能) */}
      <div className="aspect-video bg-gray-800 relative flex items-center justify-center group-hover:bg-gray-700 transition-colors">
        <span className="text-4xl">🍚</span>

        {/* 公開/非公開バッジ */}
        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-medium bg-black/60 backdrop-blur-sm text-gray-300 border border-white/10">
          {isPublic ? "Public" : "Private"}
        </div>
      </div>

      {/* 情報部分 */}
      <div className="p-4">
        <h3 className="text-white font-bold text-lg truncate mb-1 group-hover:text-blue-400 transition-colors">
          {name}
        </h3>
        <p className="text-gray-500 text-sm">
          {videoCount} {videoCount === 1 ? "video" : "videos"}
        </p>
      </div>
    </Link>
  );
}
