// src/app/upload/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/src/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";

export default function UploadPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    getUser();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setUploadStatus("");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !title) {
      setUploadStatus("ファイルを選択し、タイトルを入力してください。");
      return;
    }
    if (!user) {
      setUploadStatus("ログインが必要です。");
      return;
    }

    setIsUploading(true);
    setUploadStatus("アップロード準備中...");

    try {
      const signResponse = await fetch("/api/upload/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileSize: selectedFile.size,
          contentType: selectedFile.type,
        }),
      });

      if (!signResponse.ok) {
        const errorData = await signResponse.json();
        throw new Error(errorData.error || "署名URLの取得に失敗しました");
      }

      const { uploadUrl, objectKey } = await signResponse.json();
      setUploadStatus("動画をアップロード中...");

      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: selectedFile,
        headers: { "Content-Type": selectedFile.type },
      });

      if (!uploadResponse.ok) {
        throw new Error("R2へのアップロードに失敗しました");
      }

      setUploadStatus("メタデータを保存中...");

      // ★ TODO: /api/videos を作成し、メタデータを保存する
      // const metadataResponse = await fetch("/api/videos", {
      //     method: "POST",
      //     headers: { "Content-Type": "application/json" },
      //     body: JSON.stringify({
      //         title,
      //         description,
      //         r2ObjectKey: objectKey,
      //         fileSizeInBytes: selectedFile.size,
      //     }),
      // });

      // if (!metadataResponse.ok) {
      //     throw new Error("メタデータの保存に失敗しました。");
      // }

      setUploadStatus("アップロードが完了しました！");
      setSelectedFile(null);
      setTitle("");
      setDescription("");

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "不明なエラーが発生しました";
      setUploadStatus(`エラー: ${errorMessage}`);
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="h-10 bg-gray-200 rounded-md w-1/2"></div>
            <div className="space-y-4">
                <div className="h-5 bg-gray-200 rounded-md w-1/4"></div>
                <div className="h-12 bg-gray-200 rounded-md"></div>
            </div>
            <div className="space-y-4">
                <div className="h-5 bg-gray-200 rounded-md w-1/4"></div>
                <div className="h-12 bg-gray-200 rounded-md"></div>
            </div>
            <div className="space-y-4">
                <div className="h-5 bg-gray-200 rounded-md w-1/4"></div>
                <div className="h-24 bg-gray-200 rounded-md"></div>
            </div>
            <div className="h-14 bg-gray-200 rounded-md"></div>
        </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center space-y-4">
        <p>動画をアップロードするにはログインが必要です。</p>
        <Link href="/" className="inline-block px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700">
            ログインページへ
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">動画のアップロード</h1>
      
      <div className="space-y-2">
        <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700">動画ファイル</label>
        <input
          id="file-upload"
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        {selectedFile && <p className="text-sm text-gray-500 mt-1">{selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</p>}
      </div>

      <div className="space-y-2">
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">タイトル <span className="text-red-500">*</span></label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="動画のタイトル"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">説明</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="動画の説明を入力..."
        />
      </div>

      <button
        onClick={handleUpload}
        disabled={!selectedFile || !title || isUploading}
        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isUploading ? "アップロード中..." : "アップロード実行"}
      </button>

      {uploadStatus && (
        <p className="mt-4 text-sm text-center text-gray-700">{uploadStatus}</p>
      )}
    </div>
  );
}
