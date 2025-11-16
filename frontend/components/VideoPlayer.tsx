// components/VideoPlayer.tsx
"use client";

import { useRef, useState, useEffect } from "react";

interface VideoPlayerProps {
  src: string;
}

export default function VideoPlayer({ src }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

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

  useEffect(() => {
    // This handles the case where the video ends
    const videoElement = videoRef.current;
    if (videoElement) {
      const handleEnded = () => setIsPlaying(false);
      videoElement.addEventListener("ended", handleEnded);
      return () => {
        videoElement.removeEventListener("ended", handleEnded);
      };
    }
  }, []);

  return (
    <div className="relative w-full h-full bg-black rounded-lg" onClick={handleVideoClick}>
      <video
        ref={videoRef}
        src={src}
        loop
        className="w-full h-full object-contain"
        playsInline // Important for iOS
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
