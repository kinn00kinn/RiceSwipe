"use client";

import { useState, useCallback, ChangeEvent } from "react";
import { Button } from "./ui/Button";
import { z } from 'zod'; // Added Zod import

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
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) {
      setErrorMessage("Video file and title are required.");
      return;
    }
    setStatus("uploading");
    setErrorMessage("");

    try {
      // 1. Get presigned URL from our API
      const signResponse = await fetch("/api/upload/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
        }),
      });

      if (!signResponse.ok) {
        throw new Error("Failed to get upload signature.");
      }

      const signApiData = await signResponse.json();
      const validationResult = SignApiResponseSchema.safeParse(signApiData);

      if (!validationResult.success) {
        throw new Error(`Invalid sign API response: ${validationResult.error.message}`);
      }

      const { uploadUrl, videoId, objectKey } = validationResult.data;

      // 2. Upload file to R2 using XMLHttpRequest to track progress
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl);
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
        xhr.onerror = () => reject(new Error("Upload failed due to network error."));
        xhr.send(file);
      });

      // 3. Save video metadata to our database
      const metaResponse = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId,
          objectKey,
          title,
          description,
        }),
      });

      if (!metaResponse.ok) {
        throw new Error("Failed to save video metadata.");
      }

      setStatus("success");
      // Optionally, close modal after a short delay
      setTimeout(() => {
        onClose();
        // Here you might want to trigger a re-fetch of the video feed
      }, 2000);

    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "An unknown error occurred.");
      console.error(error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="relative bg-gray-900 rounded-lg w-full max-w-lg p-6 text-white">
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </Button>
        <h2 className="text-xl font-bold mb-4">Upload Video</h2>

        {status === "uploading" && (
          <div className="text-center">
            <p>Uploading...</p>
            <div className="w-full bg-gray-700 rounded-full h-2.5 mt-2">
              <div
                className="bg-blue-500 h-2.5 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="mt-2 text-sm">{Math.round(uploadProgress)}%</p>
          </div>
        )}

        {status === "success" && (
          <div className="text-center text-green-400">
            <p>✅ Upload successful!</p>
            <p className="text-sm">Your video will be available shortly.</p>
          </div>
        )}

        {status === "error" && (
          <div className="text-center text-red-400">
            <p>❌ Upload failed.</p>
            <p className="text-sm">{errorMessage}</p>
          </div>
        )}

        {status === "idle" && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                ${isDragging ? "border-blue-500 bg-gray-800" : "border-gray-600"}`}
            >
              <input
                id="file-upload"
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <p>Drag & drop your video here, or click to select</p>
                {file && <p className="text-sm text-gray-400 mt-2">{file.name}</p>}
              </label>
            </div>

            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-1">Title</label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-1">Description</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={!file || !title}>
                Upload
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
