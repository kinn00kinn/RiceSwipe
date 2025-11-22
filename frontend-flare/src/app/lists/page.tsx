"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import CreateListModal from "../components/lists/CreateListModal";
import ListCard from "../components/lists/ListCard";

// アイコン
const BackIcon = () => (
  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

interface ListData {
  id: string;
  name: string;
  is_public: boolean;
  videoCount: number;
}

export default function ListsPage() {
  const [lists, setLists] = useState<ListData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // リスト一覧を取得
  const fetchLists = async () => {
    try {
      const res = await fetch("/api/lists");
      if (res.ok) {
        const data = await res.json() as ListData[];
        setLists(data);
      }
    } catch (error) {
      console.error("Failed to fetch lists", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLists();
  }, []);

  // リスト作成後のコールバック
  const handleCreateSuccess = (newList: any) => {
    // 新しいリストを先頭に追加 (countは0で初期化)
    setLists((prev) => [{ ...newList, videoCount: 0 }, ...prev]);
  };

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-gray-800 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-gray-800 transition-colors">
              <BackIcon />
            </Link>
            <h1 className="text-xl font-bold">My Lists</h1>
          </div>
          
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full font-bold text-sm hover:bg-gray-200 transition-colors"
          >
            <PlusIcon />
            <span>New List</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4">
        {loading ? (
          <div className="flex justify-center pt-20">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : lists.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {lists.map((list) => (
              <ListCard
                key={list.id}
                id={list.id}
                name={list.name}
                isPublic={list.is_public}
                videoCount={list.videoCount}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-500">
            <div className="text-4xl mb-4">📝</div>
            <p className="text-lg font-medium text-white mb-2">No lists yet</p>
            <p className="mb-6">Create a list to organize your favorite rice moments.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-blue-400 hover:text-blue-300 font-medium"
            >
              Create your first list
            </button>
          </div>
        )}
      </div>

      {/* Create List Modal */}
      {isModalOpen && (
        <CreateListModal
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  );
}