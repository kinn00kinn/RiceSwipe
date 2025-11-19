"use client";

import React, { useEffect, useRef, useState } from "react";
import type { Video as VideoType } from "@prisma/client";

type VideoFromApi = VideoType & {
  author: { id: string; name: string | null };
  likeCount: number;
  isLiked: boolean;
  originalUrl?: string | null; // 追加
};

interface VideoPlayerProps {
  video: VideoFromApi;
  isActive: boolean;
}

const R2_PUBLIC_DOMAIN = process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN;
const LONG_PRESS_DURATION = 300;
const MOVE_THRESHOLD = 10;
const DOUBLE_TAP_WINDOW = 300;
const FAST_FORWARD_RATE = 2.0;
const REWIND_SPEED_SEC_PER_SEC = 3.0;

// --- Icons ---
const HeartIcon = ({ isFilled }: { isFilled: boolean }) => (
  <svg
    className={`w-8 h-8 drop-shadow-lg transition-colors ${
      isFilled ? "text-red-500" : "text-white"
    }`}
    fill={isFilled ? "currentColor" : "rgba(0,0,0,0.3)"}
    stroke={isFilled ? "none" : "currentColor"}
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.5l1.318-1.182a4.5 4.5 0 116.364 6.364L12 21l-7.682-7.318a4.5 4.5 0 010-6.364z"
    ></path>
  </svg>
);

const VolumeOnIcon = () => (
  <svg
    className="w-7 h-7 text-white drop-shadow-md"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M11 5L6 9H2v6h4l5 4V5zM16.5 12a4.5 4.5 0 00-1.5-3.5v7A4.5 4.5 0 0016.5 12z" />
  </svg>
);

const VolumeOffIcon = () => (
  <svg
    className="w-7 h-7 text-white drop-shadow-md"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <path
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 5v14l7-7-7-7z"
    />
    <path
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19 5L5 19"
    />
  </svg>
);

const ShareIcon = () => (
  <svg
    className="w-7 h-7 text-white drop-shadow-md"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
    />
  </svg>
);

const LinkIcon = () => (
  <svg
    className="w-7 h-7 text-white drop-shadow-md"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
    />
  </svg>
);

const RewindIcon = () => (
  <svg
    className="w-10 h-10 text-white animate-pulse drop-shadow-lg"
    fill="currentColor"
    viewBox="0 0 24 24"
  >
    <path d="M11 19V5l-9 7 9 7zm11 0V5l-9 7 9 7z" />
  </svg>
);

export default function VideoPlayer({ video, isActive }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isLiked, setIsLiked] = useState(video.isLiked);
  const [likeCount, setLikeCount] = useState(video.likeCount);
  const [longPressActive, setLongPressActive] = useState(false);
  const [ffDirection, setFfDirection] = useState<"forward" | "rewind" | null>(
    null
  );
  const [isMuted, setIsMuted] = useState(false);

  // mutable refs
  const startRef = useRef<{ x: number; y: number; id?: number } | null>(null);
  const lastTapTimeRef = useRef<number | null>(null);
  const lastTapPosRef = useRef<{ x: number; y: number } | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const singleTapTimerRef = useRef<number | null>(null);
  const seekingRef = useRef(false);

  // rewind rAF
  const rewindRafRef = useRef<number | null>(null);
  const rewindLastRef = useRef<number | null>(null);

  useEffect(() => {
    setIsLiked(video.isLiked);
    setLikeCount(video.likeCount);
    setProgress(0);
  }, [video.id, video.isLiked, video.likeCount]);

  if (!R2_PUBLIC_DOMAIN) {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center text-white p-4">
        Error: R2 domain not set
      </div>
    );
  }
  const videoUrl = `${R2_PUBLIC_DOMAIN}/${video.r2ObjectKey}`;
  const getValidUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    return `https://${url}`;
  };
  // autoplay when active
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (isActive) {
      el.play().catch(() => {});
    } else {
      el.pause();
      el.currentTime = 0;
      setIsPlaying(false);
      setLongPressActive(false);
      setFfDirection(null);
      el.playbackRate = 1.0;
      stopRewind();
    }
  }, [isActive]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTime = () => {
      if (el.duration) setProgress((el.currentTime / el.duration) * 100);
    };
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("timeupdate", onTime);
    return () => {
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("timeupdate", onTime);
    };
  }, []);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = isMuted;
  }, [isMuted]);

  const clearLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };
  const clearSingleTap = () => {
    if (singleTapTimerRef.current) {
      clearTimeout(singleTapTimerRef.current);
      singleTapTimerRef.current = null;
    }
  };

  const togglePlay = () => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) el.play().catch(() => {});
    else el.pause();
  };

  const doLike = async () => {
    const orig = isLiked;
    const origCount = likeCount;
    setIsLiked(!orig);
    setLikeCount(orig ? origCount - 1 : origCount + 1);
    try {
      const method = orig ? "DELETE" : "POST";
      const res = await fetch(`/api/videos/${video.id}/like`, { method });
      if (!res.ok) throw new Error("like failed");
    } catch (err) {
      console.error(err);
      setIsLiked(orig);
      setLikeCount(origCount);
    }
  };

  // --- Share & Link Handlers ---
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: video.title,
          text:
            video.description || `Check out this video by ${video.author.name}`,
          url: window.location.href, // Or specific video deep link
        });
      } catch (err) {
        console.log("Share canceled or failed", err);
      }
    } else {
      // Fallback for desktop or unsupported browsers: Copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  const handleOpenLink = () => {
    if (video.originalUrl) {
      window.open(video.originalUrl, "_blank", "noopener,noreferrer");
    }
  };

  // --- Rewind Logic ---
  const startRewind = () => {
    stopRewind();
    rewindLastRef.current = performance.now();
    const loop = (t: number) => {
      const el = videoRef.current;
      if (!el) {
        rewindRafRef.current = null;
        return;
      }
      const last = rewindLastRef.current ?? t;
      const dt = (t - last) / 1000;
      rewindLastRef.current = t;

      // Decrement time safely
      const newTime = Math.max(
        0,
        el.currentTime - REWIND_SPEED_SEC_PER_SEC * dt
      );
      el.currentTime = newTime;

      // Loop if not at start
      if (newTime > 0) {
        rewindRafRef.current = requestAnimationFrame(loop);
      } else {
        stopRewind();
        el.play().catch(() => {}); // Resume play at start? Or just pause.
        setFfDirection(null); // Auto exit rewind at start
      }
    };
    rewindRafRef.current = requestAnimationFrame(loop);
  };

  const stopRewind = () => {
    if (rewindRafRef.current) {
      cancelAnimationFrame(rewindRafRef.current);
      rewindRafRef.current = null;
    }
    rewindLastRef.current = null;
  };

  // Gestures
  const startLongPressTimer = (pointerId?: number, target?: Element) => {
    clearLongPress();
    longPressTimerRef.current = window.setTimeout(() => {
      setLongPressActive(true);
      setFfDirection("forward");
      if (videoRef.current) videoRef.current.playbackRate = FAST_FORWARD_RATE;

      if (pointerId !== undefined && target) {
        try {
          target.setPointerCapture?.(pointerId);
        } catch {}
      }
    }, LONG_PRESS_DURATION);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    startRef.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
    const now = Date.now();
    if (
      lastTapTimeRef.current &&
      now - lastTapTimeRef.current <= DOUBLE_TAP_WINDOW
    ) {
      const lastPos = lastTapPosRef.current;
      if (lastPos) {
        const dx = Math.abs(lastPos.x - e.clientX);
        const dy = Math.abs(lastPos.y - e.clientY);
        if (dx < 30 && dy < 30) {
          clearSingleTap();
          lastTapTimeRef.current = null;
          lastTapPosRef.current = null;
          doLike();
          return;
        }
      }
    }
    lastTapTimeRef.current = now;
    lastTapPosRef.current = { x: e.clientX, y: e.clientY };
    startLongPressTimer(e.pointerId, e.currentTarget as Element);
    clearSingleTap();
    singleTapTimerRef.current = window.setTimeout(() => {
      singleTapTimerRef.current = null;
    }, DOUBLE_TAP_WINDOW);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const s = startRef.current;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);

    if (!longPressActive && ady > MOVE_THRESHOLD && ady > adx) {
      clearLongPress();
    }

    if (longPressActive) {
      if (adx > MOVE_THRESHOLD && adx > ady) {
        if (dx > 0) {
          if (ffDirection !== "forward") {
            setFfDirection("forward");
            stopRewind();
            if (videoRef.current)
              videoRef.current.playbackRate = FAST_FORWARD_RATE;
          }
        } else {
          if (ffDirection !== "rewind") {
            setFfDirection("rewind");
            if (videoRef.current) videoRef.current.playbackRate = 1.0;
            startRewind();
          }
        }
        e.preventDefault();
      }
    }
    if (seekingRef.current) e.preventDefault();
  };

  const onPointerUp = (e: React.PointerEvent) => {
    clearLongPress();
    const id = startRef.current?.id;
    if (id !== undefined) {
      try {
        (e.currentTarget as Element).releasePointerCapture?.(id);
      } catch {}
    }
    if (longPressActive) {
      setLongPressActive(false);
      // Reset everything
      if (videoRef.current) videoRef.current.playbackRate = 1.0;
      stopRewind();
      if (ffDirection === "rewind") {
        if (videoRef.current && !videoRef.current.paused)
          videoRef.current.play().catch(() => {});
      }
      setFfDirection(null);
      startRef.current = null;
      return;
    }
    if (seekingRef.current) {
      seekingRef.current = false;
      startRef.current = null;
      return;
    }
    const s = startRef.current;
    const dx = s ? Math.abs(e.clientX - s.x) : 0;
    const dy = s ? Math.abs(e.clientY - s.y) : 0;
    startRef.current = null;
    if (dx <= MOVE_THRESHOLD && dy <= MOVE_THRESHOLD) {
      togglePlay();
    }
  };

  const onProgressDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    seekingRef.current = true;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    if (progressRef.current && videoRef.current) {
      const rect = progressRef.current.getBoundingClientRect();
      let ratio = (e.clientX - rect.left) / rect.width;
      ratio = Math.max(0, Math.min(1, ratio));
      videoRef.current.currentTime = (videoRef.current.duration || 0) * ratio;
      setProgress(ratio * 100);
    }
  };
  const onProgressMove = (e: React.PointerEvent) => {
    if (!seekingRef.current) return;
    if (progressRef.current && videoRef.current) {
      const rect = progressRef.current.getBoundingClientRect();
      let ratio = (e.clientX - rect.left) / rect.width;
      ratio = Math.max(0, Math.min(1, ratio));
      videoRef.current.currentTime = (videoRef.current.duration || 0) * ratio;
      setProgress(ratio * 100);
      e.preventDefault();
    }
  };
  const onProgressUp = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    seekingRef.current = false;
    (e.target as Element).releasePointerCapture?.(e.pointerId);
  };

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      className="relative w-full h-screen snap-start bg-black select-none overflow-hidden"
    >
      {/* Video wrapper */}
      <div className="flex items-center justify-center h-full bg-black">
        <video
          ref={videoRef}
          src={videoUrl}
          loop
          playsInline
          muted={isMuted}
          className="w-full h-auto max-h-full object-contain pointer-events-none"
        />
      </div>

      {/* Gesture Interaction Layer */}
      <div
        className="absolute inset-0 z-10 ui-gesture"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          clearLongPress();
          setLongPressActive(false);
          setFfDirection(null);
          stopRewind();
          seekingRef.current = false;
          startRef.current = null;
        }}
        onContextMenu={(e) => e.preventDefault()}
        style={{ touchAction: "pan-y" }}
      />

      {/* Playback Speed Overlay */}
      {(longPressActive || ffDirection) && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center animate-in fade-in zoom-in duration-200">
          <div className="bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-bold shadow-xl flex items-center gap-2">
            {ffDirection === "rewind" ? (
              <>
                <RewindIcon />
                <span>Rewind</span>
              </>
            ) : (
              <>
                <span>{FAST_FORWARD_RATE}x Speed</span>
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M4 6l8 6-8 6V6zm9 0l8 6-8 6V6z" />
                </svg>
              </>
            )}
          </div>
        </div>
      )}

      {/* Play Button Overlay (Center) */}
      <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
        {!isPlaying && !longPressActive && (
          <div
            className="p-4 rounded-full bg-black/40 backdrop-blur-sm text-white/80 pointer-events-auto transform transition-transform active:scale-95"
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
          >
            <svg
              className="w-16 h-16 drop-shadow-md"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        )}
      </div>

      {/* UI Overlay Layer */}
      <div
        className="absolute inset-0 flex flex-col justify-end pointer-events-none z-20 ui-overlay"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {/* Gradient Background for Text/Controls */}
        <div className="w-full bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-24 pb-4 px-4">
          <div className="flex items-end gap-4">
            {/* Left Side: Info & Progress */}
            <div className="flex-grow pointer-events-auto pb-2 h-40">
              <div className="text-white mb-3">
                <h3 className="font-bold text-lg drop-shadow-md flex items-center gap-2">
                  @{video.author.name || "User"}
                </h3>
                <p className="text-sm text-gray-200 mt-1 line-clamp-2 drop-shadow-md">
                  {video.title}
                </p>
                {video.description && (
                  <p className="text-xs text-gray-300 mt-1 line-clamp-1 opacity-80">
                    {video.description}
                  </p>
                )}
              </div>

              {/* Progress Bar */}
              <div
                ref={progressRef}
                className="w-full h-6 cursor-pointer group flex items-center touch-none"
                onPointerDown={onProgressDown}
                onPointerMove={onProgressMove}
                onPointerUp={onProgressUp}
              >
                <div className="bg-white/30 w-full h-1 group-hover:h-1.5 transition-all duration-200 rounded-full overflow-hidden backdrop-blur-sm">
                  <div
                    className="bg-white h-full shadow-[0_0_8px_rgba(255,255,255,0.8)] relative"
                    style={{ width: `${progress}%` }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-md scale-0 group-hover:scale-150 transition-transform" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side: Actions (Like, Share, Link, Volume) */}
            {/* Added pb-16 to avoid collision with Floating Upload Button (bottom-6 right-6) */}
            <div className="flex flex-col items-center gap-5 pointer-events-auto pb-24 min-w-[50px]">
              {/* Author Avatar (Placeholder) */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 border border-white/20 mb-2 relative">
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-red-500 rounded-full w-4 h-4 flex items-center justify-center border border-black">
                  <span className="text-white text-[10px] font-bold">+</span>
                </div>
              </div>

              {/* Like */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  doLike();
                }}
                className="flex flex-col items-center group gap-1"
              >
                <div className="transform transition-transform duration-200 active:scale-75 group-hover:scale-110">
                  <HeartIcon isFilled={isLiked} />
                </div>
                <span className="text-white text-xs font-bold drop-shadow-md">
                  {likeCount}
                </span>
              </button>

              {/* Link (External) */}
              {video.originalUrl && (
                <a
                  href={getValidUrl(video.originalUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex flex-col items-center group gap-1"
                >
                  <div className="p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors active:scale-90">
                    <LinkIcon />
                  </div>
                  <span className="text-white text-xs font-medium drop-shadow-md">
                    Link
                  </span>
                </a>
              )}

              {/* Share */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare();
                }}
                className="flex flex-col items-center group gap-1"
              >
                <div className="transform transition-transform duration-200 active:scale-90 group-hover:rotate-12">
                  <ShareIcon />
                </div>
                <span className="text-white text-xs font-medium drop-shadow-md">
                  Share
                </span>
              </button>

              {/* Volume (Toggle) */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMuted((s) => !s);
                }}
                className="p-2 rounded-full hover:bg-black/20 transition-colors mt-2 active:scale-90"
              >
                {isMuted ? <VolumeOffIcon /> : <VolumeOnIcon />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
