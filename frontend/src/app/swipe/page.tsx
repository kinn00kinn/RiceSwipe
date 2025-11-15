// src/app/swipe/page.tsx
import SwipeFeed from "@/src/components/layouts/SwipeFeed";

const SwipePage = () => {
  // publicにあるダミー動画をリストアップ
  const videoUrls = [
    "/video1.mp4",
    "/video2.mp4",
    "/video3.mp4",
  ];

  return (
    <SwipeFeed videoUrls={videoUrls} />
  );
};

export default SwipePage;
