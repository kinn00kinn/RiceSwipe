"use client";

import React from "react";
import VideoPlayer from "./VideoPlayer";
import type { Video as VideoType } from "@prisma/client";

type VideoFromApi = VideoType & {
  author: { id: string; name: string | null };
  likeCount: number;
  isLiked: boolean;
};

export default function Slide({
  video,
  index,
  currentIndex,
  onRequestNext,
  onRequestPrev,
  onUploadRequest,
}: {
  video: VideoFromApi;
  index: number;
  currentIndex: number;
  onRequestNext: () => void;
  onRequestPrev: () => void;
  onUploadRequest: () => void; // 追加
}) {
  return (
    <div
      style={{ height: "100vh", touchAction: "pan-y" }}
      className="relative w-full h-full"
    >
      <VideoPlayer 
      video={video} 
      isActive={index === currentIndex} 
      onUploadRequest={onUploadRequest} // 追加
      />
    </div>
  );
}
