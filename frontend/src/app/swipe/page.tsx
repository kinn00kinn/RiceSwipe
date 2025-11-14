import SwipeFeed from "@/src/components/layouts/SwipeFeed";

const SwipePage = () => {
  // 同じ動画を3つ並べてスワイプできるようにします
  const videoUrls = [
    "/video1.mp4",
    "/video1.mp4",
    "/video1.mp4",
  ];

  return (
    <main>
      <SwipeFeed videoUrls={videoUrls} />
    </main>
  );
};

export default SwipePage;
