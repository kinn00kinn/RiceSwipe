// components/VideoPlayer.tsx
"use client";

import { useRef, useState, useEffect } from "react";

interface VideoPlayerProps {
  src: string;
  isActive: boolean;
}

export default function VideoPlayer({ src, isActive }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Play or pause the video based on the isActive prop
  useEffect(() => {
    const videoElement = videoRef.current;
    if (videoElement) {
      if (isActive) {
        // Attempt to play the video
        videoElement.play().then(() => {
          setIsPlaying(true);
        }).catch(error => {
          // Autoplay can be blocked by browser policies
          console.error("Autoplay was prevented:", error);
          setIsPlaying(false);
        });
      } else {
        // Pause the video and reset its time when it becomes inactive
        videoElement.pause();
        videoElement.currentTime = 0;
        setIsPlaying(false);
      }
    }
  }, [isActive, src]); // Also depend on src in case the video source changes

  const handleVideoClick = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  return (
    <div className="relative w-full h-full bg-black" onClick={handleVideoClick}>
      <video
        ref={videoRef}
        src={src}
        loop
        muted // Mute is often required for autoplay to work
        className="w-full h-full object-contain"
        playsInline // Important for iOS Safari
      />
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <svg
            className="w-16 h-16 text-white opacity-75"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
