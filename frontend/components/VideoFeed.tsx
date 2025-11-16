// components/VideoFeed.tsx
"use client";

import { useVideoFeed } from "@/features/feed/hooks/useVideoFeed";
import VideoPlayer from "./VideoPlayer";
import { useState } from "react";

// Import Swiper React components and required modules
import { Swiper, SwiperSlide } from "swiper/react";
import { Mousewheel, Pagination } from "swiper/modules";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";

export default function VideoFeed() {
  const { videos, error, isLoading, isReachingEnd, setSize, size } =
    useVideoFeed();
  const [activeIndex, setActiveIndex] = useState(0);

  const handleReachEnd = () => {
    // Load more videos when the end of the swiper is reached
    if (!isReachingEnd) {
      setSize(size + 1);
    }
  };

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black text-red-500">
        <p>フィードの読み込みに失敗しました: {error.message}</p>
      </div>
    );
  }

  if (isLoading && videos.length === 0) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black text-white">
        <p>フィードを読み込み中...</p>
      </div>
    );
  }

  return (
    <Swiper
      modules={[Mousewheel, Pagination]}
      direction="vertical"
      slidesPerView={1}
      mousewheel
      pagination={{ clickable: true }}
      className="w-full h-screen"
      onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
      onReachEnd={handleReachEnd}
    >
      {videos.map((video, index) => (
        <SwiperSlide key={video.id} className="bg-black flex items-center justify-center">
          <VideoPlayer src={video.videoUrl} isActive={index === activeIndex} />
          {/* Video Info Overlay */}
          <div className="absolute bottom-10 left-0 p-4 text-white bg-gradient-to-t from-black/60 to-transparent w-full">
            <p className="font-bold text-lg">@{video.author.name}</p>
            <p className="text-sm mt-1">{video.description}</p>
          </div>
        </SwiperSlide>
      ))}

      {/* Loading indicator for the next page */}
      {!isReachingEnd && videos.length > 0 && (
        <SwiperSlide className="bg-black flex items-center justify-center text-white">
          <p>読み込み中...</p>
        </SwiperSlide>
      )}
    </Swiper>
  );
}
