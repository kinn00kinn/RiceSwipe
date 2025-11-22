"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from "react";
import type { Video as VideoType } from "@prisma/client";
import { VideoInfoOverlay } from "./player/VideoInfoOverlay";
import { VideoActionButtons } from "./player/VideoActionButtons";
import { AddToListModal } from "./lists/AddToListModal";

type VideoFromApi = VideoType & {
  author: { id: string; name: string | null };
  likeCount: number;
  isLiked: boolean;
  originalUrl?: string | null;
  compressedPaths?: any;
};

interface VideoPlayerProps {
  video: VideoFromApi;
  isActive: boolean;
  onUploadRequest: () => void;
}

const R2_PUBLIC_DOMAIN = process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN;
const LONG_PRESS_DURATION = 300;
const MOVE_THRESHOLD = 10;
const DOUBLE_TAP_WINDOW = 300;
const FAST_FORWARD_RATE = 2.0;
const REWIND_SPEED_SEC_PER_SEC = 3.0;

const RewindIcon = () => (
  <svg
    className="w-10 h-10 text-white animate-pulse drop-shadow-lg"
    fill="currentColor"
    viewBox="0 0 24 24"
  >
    <path d="M11 19V5l-9 7 9 7zm11 0V5l-9 7 9 7z" />
  </svg>
);

export default function VideoPlayer({
  video,
  isActive,
  onUploadRequest,
}: VideoPlayerProps) {
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
  const [isAddToListModalOpen, setAddToListModalOpen] = useState(false);

  // ★ UI表示管理用のState
  const [isUiVisible, setUiVisible] = useState(true);
  const uiTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startRef = useRef<{ x: number; y: number; id?: number } | null>(null);
  const lastTapTimeRef = useRef<number | null>(null);
  const lastTapPosRef = useRef<{ x: number; y: number } | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const singleTapTimerRef = useRef<number | null>(null);
  const seekingRef = useRef(false);
  const rewindRafRef = useRef<number | null>(null);
  const rewindStartDataRef = useRef<{
    timestamp: number;
    videoTime: number;
  } | null>(null);

  const videoSrc = useMemo(() => {
    if (!R2_PUBLIC_DOMAIN) return "";
    const paths = video.compressedPaths as Record<string, string> | null;
    let key = video.r2ObjectKey;
    if (paths) {
      if (paths["720p"]) key = paths["720p"];
      else if (paths["480p"]) key = paths["480p"];
      else if (paths["360p"]) key = paths["360p"];
    }
    return `${R2_PUBLIC_DOMAIN}/${key}`;
  }, [video.r2ObjectKey, video.compressedPaths]);

  // ★ UIを表示し、3秒後に非表示にする関数
  const showUiAndResetTimer = useCallback(() => {
    setUiVisible(true);
    if (uiTimerRef.current) clearTimeout(uiTimerRef.current);

    // モーダルが開いているときは消さない
    if (isAddToListModalOpen) return;

    uiTimerRef.current = setTimeout(() => {
      // 再生中かつ操作していないなら消す
      if (videoRef.current && !videoRef.current.paused) {
        setUiVisible(false);
      }
    }, 3000);
  }, [isAddToListModalOpen]);

  // ユーザーインタラクション時のハンドラ
  const handleUserInteraction = () => {
    showUiAndResetTimer();
  };

  // --- Rewind Logic ---
  const stopRewind = () => {
    if (rewindRafRef.current) {
      cancelAnimationFrame(rewindRafRef.current);
      rewindRafRef.current = null;
    }
    rewindStartDataRef.current = null;
  };

  const startRewind = () => {
    stopRewind();
    const el = videoRef.current;
    if (!el) return;
    el.pause();
    el.playbackRate = 1.0;
    rewindStartDataRef.current = {
      timestamp: performance.now(),
      videoTime: el.currentTime,
    };
    const loop = (now: number) => {
      const el = videoRef.current;
      const startData = rewindStartDataRef.current;
      if (!el || !startData) {
        rewindRafRef.current = null;
        return;
      }
      const elapsedSec = (now - startData.timestamp) / 1000;
      const targetTime = Math.max(
        0,
        startData.videoTime - elapsedSec * REWIND_SPEED_SEC_PER_SEC
      );
      if (!el.seeking) el.currentTime = targetTime;
      if (targetTime > 0) {
        rewindRafRef.current = requestAnimationFrame(loop);
      } else {
        stopRewind();
        el.currentTime = 0;
        el.play().catch(() => {});
        setFfDirection(null);
      }
    };
    rewindRafRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
    setIsLiked(video.isLiked);
    setLikeCount(video.likeCount);
    setProgress(0);
  }, [video.id, video.isLiked, video.likeCount]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (isActive) {
      el.play().catch(() => setIsPlaying(false));
      showUiAndResetTimer(); // 再生開始時にタイマー始動
    } else {
      el.pause();
      el.currentTime = 0;
      setIsPlaying(false);
      setLongPressActive(false);
      setFfDirection(null);
      el.playbackRate = 1.0;
      stopRewind();
      setUiVisible(true); // 停止中は表示
      if (uiTimerRef.current) clearTimeout(uiTimerRef.current);
    }
  }, [isActive, showUiAndResetTimer]);

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

  // --- Handlers ---
  const doLike = async () => {
    const orig = isLiked;
    const origCount = likeCount;
    setIsLiked(!orig);
    setLikeCount(orig ? origCount - 1 : origCount + 1);
    handleUserInteraction();
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

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    doLike();
  };

  const handleOpenAddToList = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAddToListModalOpen(true);
    // モーダルが開くのでタイマーはクリア
    if (uiTimerRef.current) clearTimeout(uiTimerRef.current);
    setUiVisible(true);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    handleUserInteraction();
    if (navigator.share) {
      try {
        await navigator.share({
          title: video.title,
          text:
            video.description || `Check out this video by ${video.author.name}`,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Share canceled", err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleUserInteraction();
    setIsMuted((prev) => !prev);
  };

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
    // UIが消えている場合は、まずUIを表示して終了（再生状態は変えない）
    if (!isUiVisible) {
      showUiAndResetTimer();
      return;
    }

    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      el.play().catch(() => {});
      showUiAndResetTimer();
    } else {
      el.pause();
      setUiVisible(true);
      if (uiTimerRef.current) clearTimeout(uiTimerRef.current);
    }
  };

  // --- Gesture Handlers ---
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
    handleUserInteraction(); // UI表示更新
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
            if (videoRef.current) {
              if (videoRef.current.paused)
                videoRef.current.play().catch(() => {});
              videoRef.current.playbackRate = FAST_FORWARD_RATE;
            }
          }
        } else {
          if (ffDirection !== "rewind") {
            setFfDirection("rewind");
            startRewind();
          }
        }
        e.preventDefault();
      }
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
      if (videoRef.current) videoRef.current.playbackRate = 1.0;
      stopRewind();
      if (videoRef.current?.paused) {
        videoRef.current.play().catch(() => {});
      }
      setFfDirection(null);
      startRef.current = null;
      // 操作後はタイマー再設定
      showUiAndResetTimer();
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

  const progressHandlers = {
    down: (e: React.PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();
      handleUserInteraction();
      seekingRef.current = true;
      (e.target as Element).setPointerCapture?.(e.pointerId);
      updateProgressFromEvent(e);
    },
    move: (e: React.PointerEvent) => {
      if (!seekingRef.current) return;
      e.preventDefault();
      handleUserInteraction();
      updateProgressFromEvent(e);
    },
    up: (e: React.PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();
      handleUserInteraction();
      seekingRef.current = false;
      (e.target as Element).releasePointerCapture?.(e.pointerId);
    },
  };

  const updateProgressFromEvent = (e: React.PointerEvent) => {
    if (progressRef.current && videoRef.current) {
      const rect = progressRef.current.getBoundingClientRect();
      let ratio = (e.clientX - rect.left) / rect.width;
      ratio = Math.max(0, Math.min(1, ratio));
      videoRef.current.currentTime = (videoRef.current.duration || 0) * ratio;
      setProgress(ratio * 100);
    }
  };

  return (
    <>
      <div
        ref={containerRef}
        tabIndex={-1}
        className="relative w-full h-screen snap-start pointer-events-auto bg-black select-none overflow-hidden"
      >
        <div className="flex items-center justify-center h-full bg-black">
          <video
            ref={videoRef}
            src={videoSrc}
            loop
            playsInline
            muted={isMuted}
            preload="metadata"
            className="w-full h-auto max-h-full object-contain pointer-events-none"
          />
        </div>

        {/* Gesture Layer */}
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
            startRef.current = null;
          }}
          onContextMenu={(e) => e.preventDefault()}
          style={{ touchAction: "pan-y" }}
        />

        {/* UI Overlay Layer: 不透明度とポインターイベントを制御 */}
        <div
          className={`absolute inset-0 flex flex-col justify-end z-20 ui-overlay transition-opacity duration-300 ${
            isUiVisible
              ? "opacity-100 pointer-events-none"
              : "opacity-0 pointer-events-none"
          }`}
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="w-full bg-gradient-to-t from-black/90 via-black/40 to-transparent pt-32 pb-4 px-4">
            <div className="flex items-end gap-4">
              <VideoInfoOverlay
                authorName={video.author.name}
                title={video.title}
                description={video.description}
                progress={progress}
                progressRef={progressRef}
                onProgressInteract={progressHandlers}
              />

              <div
                className={`transition-opacity duration-300 ${
                  isUiVisible ? "pointer-events-auto" : "pointer-events-none"
                }`}
              >
                <VideoActionButtons
                  isLiked={isLiked}
                  likeCount={likeCount}
                  onLike={handleLike}
                  onOpenAddToList={handleOpenAddToList}
                  originalUrl={video.originalUrl}
                  onShare={handleShare}
                  isMuted={isMuted}
                  onToggleMute={handleToggleMute}
                  onUploadRequest={onUploadRequest}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Play/Speed/Rewind Indicators */}
        {(longPressActive || ffDirection) && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center">
            <div className="bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-bold shadow-xl flex items-center gap-2">
              {ffDirection === "rewind" ? (
                <>
                  <RewindIcon />
                  <span>Rewind</span>
                </>
              ) : (
                <>
                  <span>{FAST_FORWARD_RATE}x Speed</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* モーダル */}
      {isAddToListModalOpen && (
        <AddToListModal
          videoId={video.id}
          onClose={() => setAddToListModalOpen(false)}
        />
      )}
    </>
  );
}
