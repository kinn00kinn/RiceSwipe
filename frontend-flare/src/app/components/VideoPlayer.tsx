'use client';

import { useState, useRef, useEffect, MouseEvent } from 'react';
import type { Video as VideoType } from '@prisma/client';

// This type should ideally be shared, but we redefine it here for simplicity.
// It matches the shape of the data from /api/feed
type VideoFromApi = VideoType & {
  author: {
    id: string;
    name: string | null;
  };
  likeCount: number;
  isLiked: boolean;
};

interface VideoPlayerProps {
  video: VideoFromApi;
  isActive: boolean;
}

const R2_PUBLIC_DOMAIN = process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN;

// Heart SVG Icon
const HeartIcon = ({ isFilled }: { isFilled: boolean }) => (
  <svg className="w-8 h-8 text-white" fill={isFilled ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.5l1.318-1.182a4.5 4.5 0 116.364 6.364L12 21l-7.682-7.318a4.5 4.5 0 010-6.364z"></path>
  </svg>
);


export default function VideoPlayer({ video, isActive }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressContainerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  // Like feature state
  const [isLiked, setIsLiked] = useState(video.isLiked);
  const [likeCount, setLikeCount] = useState(video.likeCount);

  // Sync state when the video prop changes
  useEffect(() => {
    setIsLiked(video.isLiked);
    setLikeCount(video.likeCount);
    setProgress(0); // Reset progress for new video
  }, [video.id, video.isLiked, video.likeCount]);


  if (!R2_PUBLIC_DOMAIN) {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center text-white text-center p-4">
        <p>Error: NEXT_PUBLIC_R2_PUBLIC_DOMAIN is not set.</p>
      </div>
    );
  }
  const videoUrl = `${R2_PUBLIC_DOMAIN}/${video.r2ObjectKey}`;

  // Autoplay/pause logic
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (isActive) {
      videoElement.play().catch(error => console.warn("Autoplay was prevented:", error));
    } else {
      videoElement.pause();
      videoElement.currentTime = 0;
      setIsPlaying(false);
    }
  }, [isActive]);

  // Play/pause status listener
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    videoElement.addEventListener('play', onPlay);
    videoElement.addEventListener('pause', onPause);
    return () => {
      videoElement.removeEventListener('play', onPlay);
      videoElement.removeEventListener('pause', onPause);
    };
  }, []);

  // Progress bar listener
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;
    const handleTimeUpdate = () => {
      if (videoElement.duration) {
        setProgress((videoElement.currentTime / videoElement.duration) * 100);
      }
    };
    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    return () => videoElement.removeEventListener('timeupdate', handleTimeUpdate);
  }, []);

  const togglePlay = () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;
    if (videoElement.paused) videoElement.play();
    else videoElement.pause();
  };

  const handleSeek = (e: MouseEvent<HTMLDivElement>) => {
    if (!progressContainerRef.current || !videoRef.current?.duration) return;
    const rect = progressContainerRef.current.getBoundingClientRect();
    const seekPosition = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = seekPosition * videoRef.current.duration;
  };

  const handleLike = async () => {
    // Optimistic update
    const originalLiked = isLiked;
    const originalLikeCount = likeCount;

    setIsLiked(!originalLiked);
    setLikeCount(originalLiked ? originalLikeCount - 1 : originalLikeCount + 1);

    try {
      const method = originalLiked ? 'DELETE' : 'POST';
      const response = await fetch(`/api/videos/${video.id}/like`, { method });

      if (!response.ok) {
        // Revert on failure
        throw new Error('Failed to update like status');
      }
    } catch (error) {
      console.error(error);
      // Revert UI changes if API call fails
      setIsLiked(originalLiked);
      setLikeCount(originalLikeCount);
    }
  };

  return (
    <div className="relative w-full h-full bg-black">
      <video
        ref={videoRef}
        src={videoUrl}
        loop
        playsInline
        muted // Autoplay requires muted
        className="w-full h-full object-cover"
        onClick={togglePlay}
      />
      
      <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
        {/* Top section (empty for now) */}
        <div></div>

        {/* Middle section for play icon */}
        <div className="flex-grow flex items-center justify-center">
          {!isPlaying && (
            <div className="p-4 rounded-full bg-black/50">
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
            </div>
          )}
        </div>

        {/* Bottom section for info and controls */}
        <div className="flex items-end gap-4">
          {/* Left side: Video Info & Progress */}
          <div className="flex-grow">
            <div className="text-white">
              <h3 className="font-bold text-lg">{video.author.name || 'Unknown'}</h3>
              <p className="text-sm">{video.title}</p>
            </div>
            <div 
              ref={progressContainerRef}
              role="button"
              className="w-full h-5 cursor-pointer group pointer-events-auto"
              onClick={handleSeek}
            >
              <div className="bg-white/20 w-full h-1 group-hover:h-2 transition-all duration-200 mt-2">
                <div className="bg-white h-full" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          </div>

          {/* Right side: Action Buttons (Like) */}
          <div className="flex flex-col items-center gap-4 pointer-events-auto">
            <button onClick={handleLike} className="flex flex-col items-center">
              <HeartIcon isFilled={isLiked} />
              <span className="text-white text-sm font-bold">{likeCount}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
