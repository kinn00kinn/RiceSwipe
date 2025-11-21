import React from "react";

interface VideoInfoOverlayProps {
  authorName: string | null;
  title: string;
  description: string | null;
  progress: number;
  onProgressInteract: {
    down: (e: React.PointerEvent) => void;
    move: (e: React.PointerEvent) => void;
    up: (e: React.PointerEvent) => void;
  };
  progressRef: React.RefObject<HTMLDivElement | null>;
}

export const VideoInfoOverlay = React.memo(
  ({
    authorName,
    title,
    description,
    progress,
    onProgressInteract,
    progressRef,
  }: VideoInfoOverlayProps) => {
    return (
      // 重要: pointer-events-auto を指定
      <div className="flex-grow pointer-events-auto pb-2 h-40">
        <div className="text-white mb-3">
          <h3 className="font-bold text-lg drop-shadow-md flex items-center gap-2">
            @{authorName || "User"}
          </h3>
          <p className="text-sm text-gray-200 mt-1 line-clamp-2 drop-shadow-md">
            {title}
          </p>
          {description && (
            <p className="text-xs text-gray-300 mt-1 line-clamp-1 opacity-80">
              {description}
            </p>
          )}
        </div>

        {/* Progress Bar */}
        <div
          ref={progressRef}
          className="w-full h-6 cursor-pointer group flex items-center touch-none"
          onPointerDown={onProgressInteract.down}
          onPointerMove={onProgressInteract.move}
          onPointerUp={onProgressInteract.up}
          // ここで stopPropagation しておくと安心
          onClick={(e) => e.stopPropagation()}
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
    );
  }
);
VideoInfoOverlay.displayName = "VideoInfoOverlay";
