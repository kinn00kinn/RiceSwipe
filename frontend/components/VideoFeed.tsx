// components/VideoFeed.tsx
"use client";

import { useVideoFeed } from "@/features/feed/hooks/useVideoFeed";
import VideoPlayer from "./VideoPlayer";
import { useInView } from "react-intersection-observer";
import { useEffect } from "react";

export default function VideoFeed() {
  const {
    videos,
    error,
    isLoading,
    isLoadingMore,
    isReachingEnd,
    setSize,
    size,
  } = useVideoFeed();
  
  // This hook gives us a `ref` to attach to an element and a boolean `inView`.
  const { ref, inView } = useInView({
    threshold: 0.5, // Trigger when 50% of the element is visible
    triggerOnce: false, // Keep observing
  });

  // When the trigger element (`ref`) is in view, load the next page.
  useEffect(() => {
    if (inView && !isReachingEnd && !isLoadingMore) {
      setSize(size + 1);
    }
  }, [inView, isReachingEnd, isLoadingMore, setSize, size]);

  if (error) {
    return (
      <div className="text-red-500">
        フィードの読み込みに失敗しました。
        <pre className="text-xs">{error.message}</pre>
      </div>
    );
  }

  // Show initial loading state
  if (isLoading && videos.length === 0) {
    return <div>フィードを読み込み中...</div>;
  }

  // Show if there are no videos at all
  if (!isLoading && videos.length === 0) {
    return <div>動画がありません。</div>;
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-8">
      {videos.map((video) => (
        <div key={video.id} className="bg-white shadow-lg rounded-lg p-4">
          <div className="aspect-w-9 aspect-h-16">
            {/* The video URL is now directly available from the API */}
            <VideoPlayer src={video.videoUrl} />
          </div>
          <div className="mt-4">
            <p className="font-bold">{video.title}</p>
            <p className="text-sm text-gray-600">投稿者: {video.author.name}</p>
            <p className="text-sm text-gray-800 mt-2">{video.description}</p>
          </div>
        </div>
      ))}

      {/* This invisible element will trigger loading more videos when it becomes visible */}
      <div ref={ref} className="h-10 flex justify-center items-center">
        {isLoadingMore && !isReachingEnd && <p>読み込み中...</p>}
      </div>

      {isReachingEnd && videos.length > 0 && (
        <div className="text-center text-gray-500 py-4">
          <p>これ以上動画はありません</p>
        </div>
      )}
    </div>
  );
}
