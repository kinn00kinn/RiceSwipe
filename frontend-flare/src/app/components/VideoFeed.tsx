'use client';

import { useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import useSWR from 'swr';
import type { Video as VideoType } from '@prisma/client';
import VideoPlayer from './VideoPlayer';

// APIレスポンスの型を拡張
type VideoWithAuthor = VideoType & {
  author: {
    id: string;
    name: string | null;
  };
};

// SWRのためのfetcher関数
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function VideoFeed() {
  const { data: videos, error, isLoading } = useSWR<VideoWithAuthor[]>('/api/feed', fetcher);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlers = useSwipeable({
    onSwipedUp: () => {
      if (!videos) return;
      setCurrentIndex((prevIndex) => Math.min(prevIndex + 1, videos.length - 1));
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
    return <div className="text-center text-red-500">Error: {error?.message || 'Failed to load videos.'}</div>;
  }

  if (videos.length === 0) {
    return <div className="text-center">No videos found.</div>;
  }

  return (
    <div {...handlers} className="relative w-full h-[80vh] max-w-md mx-auto bg-black rounded-lg overflow-hidden">
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
