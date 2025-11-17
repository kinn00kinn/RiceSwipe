'use client';

import { useState, useRef, useEffect, MouseEvent } from 'react';
import type { Video as VideoType } from '@prisma/client';

// VideoFeedから渡される型
type VideoWithAuthor = VideoType & {
  author: {
    id: string;
    name: string | null;
  };
};

interface VideoPlayerProps {
  video: VideoWithAuthor;
  isActive: boolean;
}

const R2_PUBLIC_DOMAIN = process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN;

export default function VideoPlayer({ video, isActive }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressContainerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  if (!R2_PUBLIC_DOMAIN) {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center text-white text-center p-4">
        <p>
          Error: NEXT_PUBLIC_R2_PUBLIC_DOMAIN is not set.
          <br />
          Please set it in your .env.local file.
        </p>
      </div>
    );
  }

  const videoUrl = `${R2_PUBLIC_DOMAIN}/${video.r2ObjectKey}`;

  // アクティブ状態に応じて再生/停止を制御
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (isActive) {
      // isPlaying をすぐに true に設定しようとせず、play() の成功を待つ
      const playPromise = videoElement.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch((error) => {
            console.warn("Autoplay was prevented:", error);
            setIsPlaying(false); // 再生に失敗したら false に戻す
          });
      }
    } else {
      videoElement.pause();
      videoElement.currentTime = 0;
      setIsPlaying(false);
    }
  }, [isActive]);

  // 動画の再生時間を監視してプログレスバーを更新
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleTimeUpdate = () => {
      if (videoElement.duration) {
        setProgress((videoElement.currentTime / videoElement.duration) * 100);
      }
    };

    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, []);

  const togglePlay = () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (videoElement.paused) {
      videoElement.play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    } else {
      videoElement.pause();
      setIsPlaying(false);
    }
  };

  // プログレスバークリックで再生位置を変更 (シーク)
  const handleSeek = (e: MouseEvent<HTMLDivElement>) => {
    if (!progressContainerRef.current || !videoRef.current || !videoRef.current.duration) return;
    const rect = progressContainerRef.current.getBoundingClientRect();
    const seekPosition = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = seekPosition * videoRef.current.duration;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, action: () => void) => {
    if (e.key === 'Enter') {
      action();
    }
  };

  return (
    <div className="relative w-full h-full bg-black">
      <video
        ref={videoRef}
        src={videoUrl}
        loop
        playsInline
        muted // 自動再生のためにミュートにする
        className="w-full h-full object-contain"
        onClick={togglePlay}
      />
      
      {/* --- UI Overlay --- */}
      <div className="absolute inset-0 flex flex-col justify-between">
        {/* Top gradient */}
        <div className="w-full h-20 bg-gradient-to-b from-black/50 to-transparent"></div>

        {/* Center play/pause icon */}
        <div 
          role="button"
          tabIndex={0}
          className="flex-grow flex items-center justify-center" 
          onClick={togglePlay}
          onKeyDown={(e) => handleKeyDown(e, togglePlay)}
        >
          {!isPlaying && (
            <div className="p-4 rounded-full bg-black/50 pointer-events-none">
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
            </div>
          )}
        </div>

        {/* Bottom controls */}
        <div className="w-full h-28 bg-gradient-to-t from-black/50 to-transparent p-4">
          <div className="text-white">
            <h3 className="font-bold text-lg">{video.title}</h3>
            <p className="text-sm">{video.author.name || 'Unknown'}</p>
          </div>
          {/* Progress Bar */}
          <div 
            ref={progressContainerRef}
            role="button"
            tabIndex={0}
            className="w-full h-5 cursor-pointer group"
            onClick={handleSeek}
          >
            <div className="bg-white/20 w-full h-1 group-hover:h-2 transition-all duration-200 mt-2">
              <div className="bg-white h-full" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
