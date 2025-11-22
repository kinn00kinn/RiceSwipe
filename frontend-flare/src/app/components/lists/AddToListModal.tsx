"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import CreateListModal from "./CreateListModal";

// Listの型定義 (APIから返されるデータ構造に合わせる)
interface PlayList {
  id: string;
  name: string;
  is_public: boolean;
  owner_id: string;
  created_at: string;
}

interface AddToListModalProps {
  videoId: string;
  onClose: () => void;
}

export function AddToListModal({ videoId, onClose }: AddToListModalProps) {
  const [lists, setLists] = useState<PlayList[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null); // 追加中のリストIDを管理
  const [isCreateListModalOpen, setCreateListModalOpen] = useState(false);

  // ユーザーのリスト一覧を取得する関数
  const fetchLists = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/lists");
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
  }, []);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  // 動画をリストに追加するハンドラ
  const handleAddToList = async (listId: string) => {
    try {
      setAdding(listId);
      const response = await fetch("/api/list-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId, listId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // すでに存在する場合も成功として扱う
        if (response.status === 409) {
           toast.info((errorData as any).error || "This video is already in the list.");
        } else {
          throw new Error((errorData as any).error || "Failed to add video to list");
        }
      } else {
        const listName = lists.find(l => l.id === listId)?.name;
        toast.success(`Added to "${listName || 'list'}"`);
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "An unexpected error occurred.");
    } finally {
      setAdding(null);
      // 処理完了後、少し待ってからモーダルを閉じる
      setTimeout(() => {
        onClose();
      }, 800);
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
          <h2 className="text-xl font-bold text-white mb-4">Add to list...</h2>
          
          <div className="max-h-80 overflow-y-auto space-y-2">
            {loading ? (
              <div className="text-gray-400">Loading lists...</div>
            ) : lists.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <p className="mb-4">You haven't created any lists yet.</p>
                <button
                  onClick={() => setCreateListModalOpen(true)}
                  className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create a new list
                </button>
              </div>
            ) : (
              lists.map((list) => (
                <button
                  key={list.id}
                  onClick={() => handleAddToList(list.id)}
                  disabled={!!adding}
                  className="w-full text-left p-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  <p className="font-semibold text-white">{list.name}</p>
                  <p className="text-sm text-gray-400">
                    {list.is_public ? "Public" : "Private"}
                  </p>
                  {adding === list.id && <div className="text-xs text-blue-400">Adding...</div>}
                </button>
              ))
            )}
          </div>

          <button
            onClick={onClose}
            className="mt-6 w-full py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>

      {isCreateListModalOpen && (
        <CreateListModal
          onClose={() => setCreateListModalOpen(false)}
          onSuccess={() => {
            setCreateListModalOpen(false);
            toast.success("New list created!");
            fetchLists();
          }}
        />
      )}
    </>
  );
}
