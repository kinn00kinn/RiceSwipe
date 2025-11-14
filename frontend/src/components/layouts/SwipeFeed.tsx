"use client";

import { useRef, useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";

interface VideoPlayerProps {
  src: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { ref, inView } = useInView({
    threshold: 0.9, // 90%以上表示されたら inView = true
  });

  useEffect(() => {
    if (inView) {
      videoRef.current?.play();
    } else {
      if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    }
  }, [inView]);

  return (
    <div ref={ref} className="h-full w-full snap-start relative">
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-cover"
        loop
        playsInline
        muted // 自動再生のためにミュートが必要
      />
    </div>
  );
};

interface SwipeFeedProps {
  videoUrls: string[];
}

const SwipeFeed: React.FC<SwipeFeedProps> = ({ videoUrls }) => {
  return (
    <div className="h-screen w-screen overflow-y-scroll snap-y snap-mandatory">
      {videoUrls.map((url, index) => (
        <VideoPlayer key={index} src={url} />
      ))}
    </div>
  );
};

export default SwipeFeed;
