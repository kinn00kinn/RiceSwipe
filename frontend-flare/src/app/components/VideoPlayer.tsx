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

const HeartIcon = ({ isFilled }: { isFilled: boolean }) => (
  <svg
    className="w-8 h-8 text-white"
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

export default function VideoPlayer({ video, isActive }: VideoPlayerProps) {
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

  // long press start (do not capture immediately — capture only when long press confirmed)
  const startLongPressTimer = (pointerId?: number, target?: Element) => {
    clearLongPress();
    longPressTimerRef.current = window.setTimeout(() => {
      setLongPressActive(true);
      setFfDirection("forward");
      if (videoRef.current) videoRef.current.playbackRate = FAST_FORWARD_RATE;
      // capture pointer on video element so moves and up are reliably received
      if (pointerId !== undefined && target) {
        try {
          target.setPointerCapture?.(pointerId);
        } catch {}
      }
    }, LONG_PRESS_DURATION);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    // record start pos
    startRef.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
    // double tap detection
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
          // double tap -> like
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

    // start long press timer — pass pointer id and target so we can capture on long-press
    startLongPressTimer(e.pointerId, e.currentTarget as Element);

    // schedule single tap fallback (kept minimal)
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

    // if movement clearly vertical before long press -> cancel long press (so parent Slide can handle)
    if (!longPressActive && ady > MOVE_THRESHOLD && ady > adx) {
      // cancel long-press (allow parent slide to see this)
      clearLongPress();
      // do not call preventDefault so parent can scroll/slide
    }

    if (longPressActive) {
      // if long press active, check horizontal direction
      if (adx > MOVE_THRESHOLD && adx > ady) {
        if (dx > 0) {
          // right -> forward
          if (ffDirection !== "forward") {
            setFfDirection("forward");
            stopRewind();
            if (videoRef.current)
              videoRef.current.playbackRate = FAST_FORWARD_RATE;
          }
        } else {
          // left -> rewind
          if (ffDirection !== "rewind") {
            setFfDirection("rewind");
            if (videoRef.current) videoRef.current.playbackRate = 1.0;
            startRewind();
          }
        }
        // prevent parent vertical scroll while performing horizontal ff/rewind
        e.preventDefault();
      }
    }

    if (seekingRef.current) {
      e.preventDefault();
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    clearLongPress();
    // release pointer capture if we captured it on the target
    const id = startRef.current?.id;
    if (id !== undefined) {
      try {
        (e.currentTarget as Element).releasePointerCapture?.(id);
      } catch {}
    }
    // if long press active -> stop ff/rewind
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

    // small movement => single tap (toggle). If double-tap already handled, lastTapTimeRef will be cleared earlier.
    if (dx <= MOVE_THRESHOLD && dy <= MOVE_THRESHOLD) {
      // toggle play
      togglePlay();
    }
  };

  // progress handlers
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
    <div className="relative w-full md:max-w-sm h-screen snap-start bg-black">
      <video
        ref={videoRef}
        src={videoUrl}
        loop
        playsInline
        muted
        className="w-full h-full object-cover"
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
      />

      <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
        <div className="flex justify-center">
          {longPressActive && ffDirection === "forward" && (
            <div className="bg-black/60 text-white px-3 py-1 rounded-full text-sm font-bold pointer-events-auto">
              &raquo; {FAST_FORWARD_RATE}x
            </div>
          )}
          {longPressActive && ffDirection === "rewind" && (
            <div className="bg-black/60 text-white px-3 py-1 rounded-full text-sm font-bold pointer-events-auto">
              &laquo; rewind
            </div>
          )}
        </div>

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
                className="w-12 h-12 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
            </div>
          )}
        </div>

        <div className="flex items-end gap-4">
          <div className="flex-grow pointer-events-auto">
            <div className="text-white">
              <h3 className="font-bold text-lg">
                {video.author.name || "Unknown"}
              </h3>
              <p className="text-sm">{video.title}</p>
            </div>

            <div
              ref={progressRef}
              role="slider"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress)}
              className="w-full h-6 cursor-pointer group pointer-events-auto mt-2"
              onPointerDown={onProgressDown}
              onPointerMove={onProgressMove}
              onPointerUp={onProgressUp}
              onPointerCancel={() => {
                seekingRef.current = false;
              }}
            >
              <div className="bg-white/20 w-full h-1 group-hover:h-2 transition-all duration-150">
                <div
                  className="bg-white h-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 pointer-events-auto pr-2">
            <button
              onClick={(e) => likeButton(e)}
              onPointerDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              className="flex flex-col items-center"
              aria-pressed={isLiked}
            >
              <HeartIcon isFilled={isLiked} />
              <span className="text-white text-sm font-bold">{likeCount}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
