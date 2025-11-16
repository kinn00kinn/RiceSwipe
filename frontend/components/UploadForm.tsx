// components/UploadForm.tsx
"use client";

import { useState } from "react";
import { useAuthStore } from "@/stores/authStore";

export default function UploadForm() {
  const { user } = useAuthStore();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("idle"); // idle, signing, uploading, saving, success, error
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) {
      setError("動画ファイルとタイトルは必須です。");
      return;
    }
    if (!user) {
      setError("ログインが必要です。");
      return;
    }

    setError(null);
    setStatus("signing");

    try {
      // 1. Get presigned URL
      const signResponse = await fetch("/api/upload/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
        }),
      });

      if (!signResponse.ok) throw new Error("署名付きURLの取得に失敗しました。");
      const { uploadUrl, videoId } = await signResponse.json();

      // 2. Upload file to R2
      setStatus("uploading");
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!uploadResponse.ok) throw new Error("R2へのアップロードに失敗しました。");

      // 3. Save metadata
      setStatus("saving");
      const metaResponse = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId, title, description }),
      });

      if (!metaResponse.ok) throw new Error("メタデータの保存に失敗しました。");

      setStatus("success");
      // Reset form
      setFile(null);
      setTitle("");
      setDescription("");

    } catch (err: any) {
      console.error(err);
      setError(err.message);
      setStatus("error");
    }
  };

  if (!user) {
    return null; // Don't show form if not logged in
  }

  const isUploading = status === "signing" || status === "uploading" || status === "saving";

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">動画をアップロード</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="file" className="block text-sm font-medium text-gray-700">動画ファイル</label>
          <input type="file" id="file" accept="video/*" onChange={handleFileChange} required className="mt-1 block w-full" />
        </div>
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">タイトル</label>
          <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">説明</label>
          <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"></textarea>
        </div>
        <button type="submit" disabled={isUploading} className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400">
          {isUploading ? `${status}...` : "アップロード"}
        </button>
        {status === "success" && <p className="text-green-500">アップロードが完了しました！</p>}
        {error && <p className="text-red-500">{error}</p>}
      </form>
    </div>
  );
}
