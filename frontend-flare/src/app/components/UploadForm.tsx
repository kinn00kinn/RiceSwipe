"use client";

import { useState, FormEvent } from "react";

export default function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<
    "initial" | "uploading" | "success" | "error"
  >("initial");
  const [uploadedFileKey, setUploadedFileKey] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
      setStatus("initial");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) {
      setStatus("error");
      return;
    }

    setStatus("uploading");

    try {
      // 1. /api/upload にリクエストして署名付きURLを取得
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });

      if (!response.ok) {
        throw new Error("Failed to get pre-signed URL.");
      }

      // APIからのレスポンスの型を定義
      type ApiUploadResponse = {
        signedUrl: string;
        key: string;
      };

      // response.json() の結果を定義した型として扱う (型アサーション)
      const { signedUrl, key } = (await response.json()) as ApiUploadResponse;

      // 2. 取得した署名付きURLを使ってR2にファイルを直接アップロード
      const uploadResponse = await fetch(signedUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("File upload failed.");
      }

      setStatus("success");
      setUploadedFileKey(key);
    } catch (error) {
      console.error(error);
      setStatus("error");
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md border">
      <h2 className="text-2xl font-bold text-center text-gray-800">
        Upload a File to R2
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="file-upload"
            className="block text-sm font-medium text-gray-700 sr-only"
          >
            Select file
          </label>
          <input
            id="file-upload"
            type="file"
            onChange={handleFileChange}
            required
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
        <button
          type="submit"
          disabled={!file || status === "uploading"}
          className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
        >
          {status === "uploading" ? "Uploading..." : "Upload"}
        </button>
      </form>
      {status === "success" && (
        <div className="p-3 text-sm text-green-700 bg-green-100 rounded-md">
          <p>✅ File uploaded successfully!</p>
          <p className="break-all">
            <span className="font-semibold">File Key:</span> {uploadedFileKey}
          </p>
          <p className="mt-2 text-xs">
            Note: To view the file, you need to connect your R2 bucket to a
            public domain.
          </p>
        </div>
      )}
      {status === "error" && (
        <p className="p-3 text-sm text-red-700 bg-red-100 rounded-md">
          ❌ Upload failed. Please check console for errors.
        </p>
      )}
    </div>
  );
}
