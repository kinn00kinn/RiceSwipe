"use client";

import { useRef, useEffect } from "react";
import { useInView } from "react-intersection-observer";

interface VideoPlayerProps {
  src: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { ref, inView } = useInView({
    threshold: 0.8, // 80%以上表示されたら inView = true
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
    <div
      ref={ref}
      // ヘッダー(4rem)とフッター(4rem)を除いた高さを設定
      className="h-[calc(100dvh-8rem)] w-full snap-start relative flex items-center justify-center bg-black"
    >
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-contain" // 動画全体が見えるように contain に変更
        loop
        playsInline
        muted // 自動再生のためにミュートが必要
        preload="none" // 初期ロードの負荷を軽減
      />
    </div>
  );
};

interface SwipeFeedProps {
  videoUrls: string[];
}

const SwipeFeed: React.FC<SwipeFeedProps> = ({ videoUrls }) => {
  return (
    <div className="absolute inset-x-0 top-16 bottom-16 overflow-y-auto snap-y snap-mandatory">
      {videoUrls.map((url, index) => (
        <VideoPlayer key={index} src={url} />
      ))}
    </div>
  );
};

export default SwipeFeed;
