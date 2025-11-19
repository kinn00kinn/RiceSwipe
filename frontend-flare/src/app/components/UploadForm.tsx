"use client";

import { useState, FormEvent, ChangeEvent } from "react";

export default function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [status, setStatus] = useState<
    "initial" | "uploading" | "success" | "error"
  >("initial");
  const [resultData, setResultData] = useState<{
    key: string;
    videoId: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);

      // UX向上: ファイル選択時にタイトルが空なら、ファイル名(拡張子なし)を自動セット
      if (!title) {
        const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, "");
        setTitle(nameWithoutExt);
      }

      setStatus("initial");
      setErrorMessage("");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMessage("Please select a file.");
      setStatus("error");
      return;
    }

    setStatus("uploading");
    setErrorMessage("");

    try {
      // 1. /api/upload にリクエストして署名付きURLとメタデータ保存を依頼
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          title: title,
          description: description,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error || "Failed to get pre-signed URL.");
      }

      // APIからのレスポンス型
      type ApiUploadResponse = {
        success: boolean;
        signedUrl: string;
        key: string;
        videoId: string;
      };

      const { signedUrl, key, videoId } =
        (await response.json()) as ApiUploadResponse;

      // 2. 取得した署名付きURLを使ってR2にファイルを直接アップロード
      const uploadResponse = await fetch(signedUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("File upload to R2 failed.");
      }

      setStatus("success");
      setResultData({ key, videoId });

      // 成功したらフォームをリセットするかどうかは要件次第（ここではリセットしない）
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
      setStatus("error");
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md border">
      <h2 className="text-2xl font-bold text-center text-gray-800">
        Upload Video
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title Input */}
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700"
          >
            Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Video Title"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>

        {/* Description Input */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700"
          >
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Video description..."
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>

        {/* File Input */}
        <div>
          <label
            htmlFor="file-upload"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Video File
          </label>
          <input
            id="file-upload"
            type="file"
            accept="video/*" // 動画のみ許可する場合
            onChange={handleFileChange}
            required
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!file || status === "uploading"}
          className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {status === "uploading" ? "Uploading..." : "Upload"}
        </button>
      </form>

      {/* Success Message */}
      {status === "success" && resultData && (
        <div className="p-4 text-sm text-green-700 bg-green-50 rounded-md border border-green-200">
          <p className="font-bold flex items-center gap-2">
            <span>✅</span> Upload successful!
          </p>
          <div className="mt-2 space-y-1 text-xs">
            <p>
              <span className="font-semibold">Video ID:</span>{" "}
              {resultData.videoId}
            </p>
            <p className="break-all">
              <span className="font-semibold">R2 Key:</span> {resultData.key}
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {status === "error" && (
        <div className="p-4 text-sm text-red-700 bg-red-50 rounded-md border border-red-200">
          <p className="font-bold flex items-center gap-2">
            <span>❌</span> Upload failed
          </p>
          <p className="mt-1">{errorMessage}</p>
        </div>
      )}
    </div>
  );
}
