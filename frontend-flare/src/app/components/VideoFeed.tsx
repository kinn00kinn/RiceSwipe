"use client";

import { useState } from "react";
import { useSwipeable } from "react-swipeable";
import useSWR from "swr";
import type { Video as VideoType } from "@prisma/client";
import VideoPlayer from "./VideoPlayer";

// APIレスポンスの型を拡張
// /api/feed が返すオブジェクトの形状に合わせる
type VideoFromApi = VideoType & {
  author: {
    id: string;
    name: string | null;
  };
  likeCount: number;
  isLiked: boolean;
};

// SWRのためのfetcher関数
const fetcher = async (url: string): Promise<VideoFromApi[]> => {
  const res = await fetch(url);

  // If the status code is not in the range 200-299,
  // we still try to parse and throw it.
  if (!res.ok) {
    const error = new Error("An error occurred while fetching the data.");
    // Attach extra info to the error object.
    try {
      error.info = await res.json();
    } catch (e) {
      // Ignore if response is not valid JSON
    }
    error.status = res.status;
    throw error;
  }

  return res.json();
};

export default function VideoFeed() {
  const {
    data: videos,
    error,
    isLoading,
  } = useSWR<VideoFromApi[]>("/api/feed", fetcher);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlers = useSwipeable({
    onSwipedUp: () => {
      if (!videos) return;
      setCurrentIndex((prevIndex) =>
        Math.min(prevIndex + 1, videos.length - 1)
      );
    },
    onSwipedDown: () => {
      setCurrentIndex((prevIndex) => Math.max(prevIndex - 1, 0));
    },
    preventScrollOnSwipe: true,
    trackMouse: true,
  });

  if (isLoading) {
    return <div className="text-center">Loading feed...</div>;
  }

  if (error || !videos) {
    return (
      <div className="text-center text-red-500">
        Error: {error?.message || "Failed to load videos."}
      </div>
    );
  }

  if (videos.length === 0) {
    return <div className="text-center">No videos found.</div>;
  }

  return (
    <div
      {...handlers}
      className="relative w-full h-screen bg-black"
    >
      {videos.map((video, index) => (
        <div
          key={video.id}
          className="absolute w-full h-full transition-transform duration-500"
          style={{ transform: `translateY(${(index - currentIndex) * 100}%)` }}
        >
          <VideoPlayer video={video} isActive={index === currentIndex} />
        </div>
      ))}
    </div>
  );
}
