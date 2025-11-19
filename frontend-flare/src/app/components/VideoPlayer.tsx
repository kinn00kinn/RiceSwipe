"use client";

import React, { useEffect, useRef, useState } from "react";
import type { Video as VideoType } from "@prisma/client";

type VideoFromApi = VideoType & {
  author: { id: string; name: string | null };
  likeCount: number;
  isLiked: boolean;
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

// 視認性向上のため drop-shadow-md を追加
const HeartIcon = ({ isFilled }: { isFilled: boolean }) => (
  <svg
    className="w-8 h-8 text-white drop-shadow-md"
    fill={isFilled ? "currentColor" : "none"}
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.5l1.318-1.182a4.5 4.5 0 116.364 6.364L12 21l-7.682-7.318a4.5 4.5 0 010-6.364z"
    ></path>
  </svg>
);

const VolumeOnIcon = () => (
  <svg
    className="w-6 h-6 text-white drop-shadow-md"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M11 5L6 9H2v6h4l5 4V5zM16.5 12a4.5 4.5 0 00-1.5-3.5v7A4.5 4.5 0 0016.5 12z" />
  </svg>
);
const VolumeOffIcon = () => (
  <svg
    className="w-6 h-6 text-white drop-shadow-md"
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

  // keep video muted state in sync
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = isMuted;
  }, [isMuted]);

  // helpers
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

  // rewind rAF
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
      el.currentTime = Math.max(
        0,
        el.currentTime - REWIND_SPEED_SEC_PER_SEC * dt
      );
      rewindRafRef.current = requestAnimationFrame(loop);
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

  // long press start
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

    if (seekingRef.current) {
      e.preventDefault();
    }
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
      if (ffDirection === "forward") {
        if (videoRef.current) videoRef.current.playbackRate = 1.0;
      } else if (ffDirection === "rewind") {
        stopRewind();
        if (videoRef.current) videoRef.current.playbackRate = 1.0;
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

  const likeButton = (e?: React.SyntheticEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    doLike();
  };

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      className="relative w-full h-screen snap-start bg-black select-none overflow-hidden"
    >
      {/* Video wrapper */}
      <div className="flex items-center justify-center h-full">
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

      {/* UI Overlay Layer */}
      <div
        className="absolute inset-0 flex flex-col justify-between pointer-events-none z-20 ui-overlay"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {/* Top Area (Formerly Fullscreen Controls - Now Empty or FF Status) */}
        <div className="flex justify-center pt-8 h-20">
          {longPressActive && ffDirection === "forward" && (
            <div className="bg-black/60 text-white px-3 py-1 rounded-full text-sm font-bold pointer-events-auto h-fit">
              &raquo; {FAST_FORWARD_RATE}x
            </div>
          )}
          {longPressActive && ffDirection === "rewind" && (
            <div className="bg-black/60 text-white px-3 py-1 rounded-full text-sm font-bold pointer-events-auto h-fit">
              &laquo; rewind
            </div>
          )}
        </div>

        {/* Play/Pause Icon (Center) */}
        <div className="flex-grow flex items-center justify-center">
          {!isPlaying && !longPressActive && (
            <div
              className="p-4 rounded-full bg-black/50 pointer-events-auto"
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
            >
              <svg
                className="w-12 h-12 text-white drop-shadow-md"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
            </div>
          )}
        </div>

        {/* Bottom Controls Area - Gradient added here */}
        <div className="w-full bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-12 pb-12 px-4">
          <div className="flex items-end gap-4">
            {/* Text Info & Progress */}
            <div className="flex-grow pointer-events-auto">
              <div className="text-white">
                <h3 className="font-bold text-lg drop-shadow-md">
                  {video.author.name || "Unknown"}
                </h3>
                <div
                  className="mt-1 text-sm max-h-20 overflow-y-auto pr-2"
                  style={{ WebkitOverflowScrolling: "touch" }}
                >
                  <p className="whitespace-pre-wrap drop-shadow-md">
                    {video.title}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div
                ref={progressRef}
                role="slider"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress)}
                className="w-full h-12 cursor-pointer group pointer-events-auto mt-2 flex items-center"
                onPointerDown={onProgressDown}
                onPointerMove={onProgressMove}
                onPointerUp={onProgressUp}
                onPointerCancel={() => {
                  seekingRef.current = false;
                }}
              >
                <div className="bg-white/30 w-full h-1 group-hover:h-2 transition-all duration-150 rounded-full overflow-hidden backdrop-blur-sm">
                  <div
                    className="bg-white h-full shadow-[0_0_10px_rgba(255,255,255,0.7)]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Right-side controls (Like + Volume) - Layout adjusted */}
            <div className="flex flex-col items-center gap-6 pointer-events-auto pb-2">
              <button
                onClick={(e) => likeButton(e)}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                className="flex flex-col items-center group"
                aria-pressed={isLiked}
              >
                <div className="transform transition-transform duration-200 group-active:scale-90">
                  <HeartIcon isFilled={isLiked} />
                </div>
                <span className="text-white text-sm font-bold drop-shadow-md">
                  {likeCount}
                </span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setIsMuted((s) => !s);
                }}
                className="p-2 rounded-full bg-black/20 backdrop-blur-sm active:bg-black/40 transition-colors"
                aria-pressed={isMuted}
                aria-label={isMuted ? "Unmute" : "Mute"}
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
