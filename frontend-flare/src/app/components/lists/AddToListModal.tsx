"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import CreateListModal from "./CreateListModal";

interface PlayList {
  id: string;
  name: string;
  is_public: boolean;
  owner_id: string;
  created_at: string;
  hasVideo?: boolean; // 動画が含まれているか
}

interface AddToListModalProps {
  videoId: string;
  onClose: () => void;
}

export function AddToListModal({ videoId, onClose }: AddToListModalProps) {
  const [lists, setLists] = useState<PlayList[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isCreateListModalOpen, setCreateListModalOpen] = useState(false);

  // ユーザーのリスト一覧を取得 (登録状況を含む)
  const fetchLists = useCallback(async () => {
    try {
      setLoading(true);
      // videoIdをクエリに含める
      const response = await fetch(`/api/lists?videoId=${videoId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch lists");
      }
      const data = await response.json();
      setLists(data as PlayList[]);
    } catch (error) {
      console.error(error);
      toast.error("Could not load your lists.");
    } finally {
      setLoading(false);
    }
  }, [videoId]);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  // リストへの追加/削除を切り替え
  const handleToggleList = async (listId: string, currentStatus: boolean) => {
    if (processingId) return;
    setProcessingId(listId);

    try {
      if (currentStatus) {
        // 削除 (Remove)
        const response = await fetch("/api/list-items", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoId, listId }),
        });
        if (!response.ok) throw new Error("Failed to remove");
        toast.success("Removed from list");
      } else {
        // 追加 (Add)
        const response = await fetch("/api/list-items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoId, listId }),
        });
        if (!response.ok) throw new Error("Failed to add");
        toast.success("Added to list");
      }

      // リスト状態を再取得してUI更新
      await fetchLists();
    } catch (error: any) {
      console.error(error);
      toast.error("Operation failed");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
        onClick={onClose}
      >
        <div
          className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm animate-in fade-in zoom-in-95 duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Save to list</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto space-y-2">
            {loading ? (
              <div className="text-gray-400 text-center py-4">
                Loading lists...
              </div>
            ) : lists.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <p className="mb-4">No lists yet.</p>
                <button
                  onClick={() => setCreateListModalOpen(true)}
                  className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create new list
                </button>
              </div>
            ) : (
              lists.map((list) => (
                <button
                  key={list.id}
                  onClick={() => handleToggleList(list.id, !!list.hasVideo)}
                  disabled={!!processingId}
                  className="w-full flex items-center justify-between p-3 rounded-lg bg-gray-800 hover:bg-gray-750 active:scale-[0.98] transition-all"
                >
                  <div className="text-left">
                    <p
                      className={`font-semibold ${
                        list.hasVideo ? "text-blue-400" : "text-white"
                      }`}
                    >
                      {list.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {list.is_public ? "Public" : "Private"}
                    </p>
                  </div>

                  {/* チェックボックス風インジケーター */}
                  <div
                    className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${
                      list.hasVideo
                        ? "bg-blue-500 border-blue-500"
                        : "border-gray-500 hover:border-gray-300"
                    }`}
                  >
                    {processingId === list.id ? (
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      list.hasVideo && (
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          {lists.length > 0 && (
            <button
              onClick={() => setCreateListModalOpen(true)}
              className="mt-4 w-full py-2 flex items-center justify-center gap-2 text-sm font-semibold text-gray-300 hover:text-white transition-colors border border-dashed border-gray-600 rounded-lg hover:bg-gray-800"
            >
              + Create new list
            </button>
          )}

          <button
            onClick={onClose}
            className="mt-4 w-full py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>

      {isCreateListModalOpen && (
        <CreateListModal
          onClose={() => setCreateListModalOpen(false)}
          onSuccess={() => {
            setCreateListModalOpen(false);
            fetchLists();
          }}
        />
      )}
    </>
  );
}
