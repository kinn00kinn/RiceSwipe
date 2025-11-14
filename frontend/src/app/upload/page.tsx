// src/app/upload/page.tsx
"use client"; // ファイル操作やAPIリクエストのためクライアントコンポーネントにする

import React, { useState } from "react";
import { supabase } from "@/src/lib/supabaseClient"; // 認証状態の確認用

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState("");
  // TODO: プログレスバー用の state を追加

  // ファイルが選択されたときの処理
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setUploadStatus(""); // ステータスをリセット
    }
  };

  // アップロードボタンが押されたときの処理
  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadStatus("ファイルが選択されていません");
      return;
    }

    // ログインしているか確認
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setUploadStatus("ログインが必要です");
      return;
    }

    setUploadStatus("アップロード準備中...");

    try {
      // ★ 1. バックエンドAPIに署名付きURLをリクエスト
      // (docs/設計書.md のフロー)
      const signResponse = await fetch("/api/upload/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileSize: selectedFile.size,
          contentType: selectedFile.type,
          filename: selectedFile.name,
        }),
      });

      if (!signResponse.ok) {
        const errorData = await signResponse.json();
        // 容量オーバーなどのエラーをサーバーから受け取る
        throw new Error(errorData.error || "署名URLの取得に失敗しました");
      }

      const { uploadUrl, videoId, objectKey } = await signResponse.json();

      setUploadStatus("アップロード中...");

      // ★ 2. 署名付きURLを使い、R2へ直接ファイルをPUT
      // (docs/設計書.md のフロー)
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: selectedFile,
        headers: {
          "Content-Type": selectedFile.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("R2へのアップロードに失敗しました");
      }

      setUploadStatus("アップロード成功！メタデータを保存しています...");

      // ★ 3. アップロード完了後、メタデータをDBに保存するAPIを叩く (次のステップ)
      // TODO: /api/videos を呼び出す処理 (videoId, objectKey, title など)
      console.log("Uploaded Video ID:", videoId);
      console.log("Object Key:", objectKey);

      // (仮：次のステップで実装)
      setUploadStatus(`アップロード完了 (Video ID: ${videoId})`);
      setSelectedFile(null); // ファイル選択をリセット
    } catch (error: unknown) {
      let errorMessage = "不明なエラーが発生しました";

      // ★ 2. エラーが Error インスタンスか確認する
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setUploadStatus(`エラー: ${errorMessage}`);
      console.error(error);
    }
  };

  return (
    <div className="container mx-auto max-w-lg p-8">
      <h1 className="text-2xl font-bold mb-4">動画のアップロード</h1>
      <div className="mb-4">
        <input
          type="file"
          accept="video/*" // 動画ファイルのみ許可
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>
      <button
        onClick={handleUpload}
        disabled={!selectedFile || uploadStatus.includes("アップロード中")}
        className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400"
      >
        アップロード実行
      </button>
      {uploadStatus && (
        <p className="mt-4 text-sm text-gray-700">{uploadStatus}</p>
      )}
      {/* TODO: プログレスバーの実装 */}
    </div>
  );
}
