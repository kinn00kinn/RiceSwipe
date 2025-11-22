"use client";

import { useState, useCallback, ChangeEvent } from "react";
import { Button } from "./ui/Button";
import { z } from "zod";
import { Turnstile } from "@marsidev/react-turnstile";

// Define Zod schema for the sign API response
const SignApiResponseSchema = z.object({
  uploadUrl: z.string().url(),
  videoId: z.string().uuid(),
  objectKey: z.string().min(1),
});

interface UploadModalProps {
  onClose: () => void;
}

export default function UploadModal({ onClose }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [originalUrl, setOriginalUrl] = useState("");
  
  // ハッシュタグ管理
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [status, setStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      if (!title) {
        const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, "");
        setTitle(nameWithoutExt);
      }
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const selectedFile = e.dataTransfer.files[0];
        setFile(selectedFile);
        if (!title) {
          const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, "");
          setTitle((prev) => prev || nameWithoutExt);
        }
      }
    },
    [title]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  // --- ハッシュタグ処理 ---
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const val = tagInput.trim().replace(/^#/, ""); // #を除去
      if (val && !hashtags.includes(val)) {
        setHashtags([...hashtags, val]);
      }
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setHashtags(hashtags.filter((t) => t !== tagToRemove));
  };
  // ----------------------

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) {
      setErrorMessage("Video file and title are required.");
      return;
    }
    if (!turnstileToken) {
      setErrorMessage("Please complete the security check.");
      return;
    }
    setStatus("uploading");
    setErrorMessage("");

    try {
      // 1. Get presigned URL
      const signResponse = await fetch("/api/upload/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          turnstileToken,
        }),
      });

      if (!signResponse.ok) {
        throw new Error("Failed to get upload signature.");
      }

      const signApiData = await signResponse.json();
      const validationResult = SignApiResponseSchema.safeParse(signApiData);

      if (!validationResult.success) {
        throw new Error(
          `Invalid sign API response: ${validationResult.error.message}`
        );
      }

      const { uploadUrl, videoId, objectKey } = validationResult.data;

      // 2. Upload to R2
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100;
            setUploadProgress(percentComplete);
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed: ${xhr.statusText}`));
          }
        };
        xhr.onerror = () =>
          reject(new Error("Upload failed due to network error."));
        xhr.send(file);
      });

      // 3. Save metadata
      const metaResponse = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId,
          objectKey,
          title,
          description,
          originalUrl,
          hashtags, // ハッシュタグ配列を送信
        }),
      });

      if (!metaResponse.ok) {
        throw new Error("Failed to save video metadata.");
      }

      setStatus("success");
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 1500);
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "An unknown error occurred."
      );
      console.error(error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-gray-900 rounded-t-2xl sm:rounded-2xl border-t sm:border border-gray-800 shadow-2xl overflow-hidden flex flex-col max-h-[90dvh]">
        <div className="w-full flex justify-center pt-3 pb-1 sm:hidden pointer-events-none">
          <div className="w-12 h-1.5 bg-gray-700 rounded-full" />
        </div>
        <div className="p-6 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Upload Video</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-gray-800"
            >
              ✕
            </button>
          </div>
          <div className="my-4 flex justify-center">
            <Turnstile
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
              onSuccess={(token) => setTurnstileToken(token)}
            />
          </div>
          {status === "uploading" ? (
            <div className="py-10 text-center space-y-4">
              <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto" />
              <div>
                <p className="text-lg font-medium text-white mb-2">
                  Uploading...
                </p>
                <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden border border-gray-700">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-blue-400 h-full transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="mt-2 text-sm text-gray-400">
                  {Math.round(uploadProgress)}%
                </p>
              </div>
            </div>
          ) : status === "success" ? (
            <div className="py-10 text-center space-y-4">
              <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto border border-green-500/30">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-xl font-bold text-white">Upload Complete!</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {status === "error" && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-start gap-3">
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{errorMessage}</span>
                </div>
              )}

              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
                  ${
                    isDragging
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-gray-700 hover:border-gray-500 hover:bg-gray-800/50"
                  }`}
              >
                <input
                  id="file-upload"
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="file-upload" className="cursor-pointer w-full h-full block">
                  {file ? (
                    <div className="flex items-center justify-center gap-2 text-blue-400">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span className="truncate max-w-[200px] font-medium">{file.name}</span>
                    </div>
                  ) : (
                    <div className="text-gray-400 group">
                      <p className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-200">☁️</p>
                      <p className="font-medium text-gray-300">Tap to select video</p>
                      <p className="text-sm text-gray-500 mt-1">or drag and drop</p>
                    </div>
                  )}
                </label>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1.5">Title</label>
                  <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="Enter video title"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                    rows={3}
                    placeholder="What's this video about?"
                  />
                </div>

                {/* ハッシュタグ入力UI */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Hashtags</label>
                  <div className="flex flex-wrap gap-2 mb-2 min-h-[28px]">
                    {hashtags.map((tag) => (
                      <span key={tag} className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded-md text-sm flex items-center gap-1 border border-blue-500/30">
                        #{tag}
                        <button type="button" onClick={() => removeTag(tag)} className="hover:text-white ml-1">×</button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="Add tags (Enter or Space)"
                  />
                </div>

                <div>
                  <label htmlFor="originalUrl" className="block text-sm font-medium text-gray-300 mb-1.5">
                    Original URL <span className="text-gray-500 text-xs ml-1">(Optional)</span>
                  </label>
                  <input
                    id="originalUrl"
                    type="url"
                    value={originalUrl}
                    onChange={(e) => setOriginalUrl(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <Button type="button" variant="ghost" onClick={onClose} className="flex-1 text-gray-400 hover:text-white hover:bg-gray-800 py-3">Cancel</Button>
                <Button type="submit" disabled={!file || !title} className="flex-[2] bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-3 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none">Upload Video</Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}