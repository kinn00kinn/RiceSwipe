import React, { useState } from 'react';

// --- Icons ---
// ... (アイコン定義は変更なし)
const HeartIcon = ({ isFilled }: { isFilled: boolean }) => (
  <svg className={`w-8 h-8 drop-shadow-lg transition-colors ${isFilled ? "text-red-500" : "text-white"}`} fill={isFilled ? "currentColor" : "rgba(0,0,0,0.3)"} stroke={isFilled ? "none" : "currentColor"} strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.5l1.318-1.182a4.5 4.5 0 116.364 6.364L12 21l-7.682-7.318a4.5 4.5 0 010-6.364z"></path></svg>
);
const VolumeOnIcon = () => (
  <svg className="w-7 h-7 text-white drop-shadow-md" viewBox="0 0 24 24" fill="currentColor"><path d="M11 5L6 9H2v6h4l5 4V5zM16.5 12a4.5 4.5 0 00-1.5-3.5v7A4.5 4.5 0 0016.5 12z" /></svg>
);
const VolumeOffIcon = () => (
  <svg className="w-7 h-7 text-white drop-shadow-md" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M9 5v14l7-7-7-7z" /><path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M19 5L5 19" /></svg>
);
const ShareIcon = () => (
  <svg className="w-7 h-7 text-white drop-shadow-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
);
const LinkIcon = () => (
  <svg className="w-7 h-7 text-white drop-shadow-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
);
const MenuIcon = () => (
  <svg className="w-7 h-7 text-white drop-shadow-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
);
const UploadIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
);
const LogOutIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
);
const BookmarkIcon = () => (
  <svg className="w-8 h-8 text-white drop-shadow-lg" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>
);


interface VideoActionButtonsProps {
  isLiked: boolean;
  likeCount: number;
  onLike: (e: React.MouseEvent) => void;
  onOpenAddToList: (e: React.MouseEvent) => void; // 変更
  originalUrl?: string | null;
  onShare: (e: React.MouseEvent) => void;
  isMuted: boolean;
  onToggleMute: (e: React.MouseEvent) => void;
  onUploadRequest: () => void;
}

export const VideoActionButtons = React.memo(({
  isLiked, likeCount, onLike, onOpenAddToList, originalUrl, onShare, isMuted, onToggleMute, onUploadRequest
}: VideoActionButtonsProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const getValidUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `https://${url}`;
  };

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="flex flex-col items-center gap-5 pointer-events-auto pb-24 min-w-[50px] relative">
      {/* Avatar Placeholder */}
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 border border-white/20 mb-2 relative">
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-red-500 rounded-full w-4 h-4 flex items-center justify-center border border-black">
          <span className="text-white text-[10px] font-bold">+</span>
        </div>
      </div>

      {/* Like */}
      <button onClick={onLike} className="flex flex-col items-center group gap-1">
        <div className="transform transition-transform duration-200 active:scale-75 group-hover:scale-110">
          <HeartIcon isFilled={isLiked} />
        </div>
        <span className="text-white text-xs font-bold drop-shadow-md">{likeCount}</span>
      </button>

      {/* Add to List (Save) Button */}
      <button onClick={onOpenAddToList} className="flex flex-col items-center group gap-1">
        <div className="transform transition-transform duration-200 active:scale-75 group-hover:scale-110">
          <BookmarkIcon />
        </div>
        <span className="text-white text-xs font-bold drop-shadow-md">Save</span>
      </button>

      {/* Link */}
      {originalUrl && (
        <a
          href={getValidUrl(originalUrl)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex flex-col items-center group gap-1"
        >
          <div className="p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors active:scale-90">
            <LinkIcon />
          </div>
          <span className="text-white text-xs font-medium drop-shadow-md">Link</span>
        </a>
      )}

      {/* Share */}
      <button onClick={onShare} className="flex flex-col items-center group gap-1">
        <div className="transform transition-transform duration-200 active:scale-90 group-hover:rotate-12">
          <ShareIcon />
        </div>
        <span className="text-white text-xs font-medium drop-shadow-md">Share</span>
      </button>

      {/* Volume */}
      <button onClick={onToggleMute} className="p-2 rounded-full hover:bg-black/20 transition-colors mt-2 active:scale-90">
        {isMuted ? <VolumeOffIcon /> : <VolumeOnIcon />}
      </button>

      {/* Menu Button */}
      <div className="relative">
        <button 
          onClick={toggleMenu}
          className={`p-2 rounded-full transition-colors mt-2 active:scale-90 ${isMenuOpen ? 'bg-white/20' : 'hover:bg-black/20'}`}
        >
          <MenuIcon />
        </button>

        {/* Popup Menu */}
        {isMenuOpen && (
          <div className="absolute bottom-full right-12 mb-[-20px] flex flex-col gap-2 bg-black/80 backdrop-blur-md p-2 rounded-xl border border-white/10 min-w-[140px] animate-in fade-in zoom-in duration-200 origin-bottom-right">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(false);
                onUploadRequest();
              }}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 text-white text-sm transition-colors w-full text-left"
            >
              <UploadIcon />
              <span>Upload</span>
            </button>
            <form action="/auth/signout" method="post" className="w-full">
               <button 
                 type="submit"
                 className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-500/20 text-red-400 hover:text-red-300 text-sm transition-colors w-full text-left"
               >
                 <LogOutIcon />
                 <span>Logout</span>
               </button>
            </form>
          </div>
        )}
      </div>
      
      {isMenuOpen && (
        <div 
          className="fixed inset-0 z-[-1]" 
          onClick={(e) => {
            e.stopPropagation();
            setIsMenuOpen(false);
          }} 
        />
      )}
    </div>
  );
});
VideoActionButtons.displayName = 'VideoActionButtons';