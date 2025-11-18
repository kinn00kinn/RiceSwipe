'use client';

import React, { useEffect, useRef, useState } from 'react';
import useSWR from 'swr';
import type { Video as VideoType } from '@prisma/client';
import Slide from './Slide';

type VideoFromApi = VideoType & {
  author: { id: string; name: string | null };
  likeCount: number;
  isLiked: boolean;
};

const fetcher = async (url: string): Promise<VideoFromApi[]> => {
  const res = await fetch(url);
  if (!res.ok) {
    const err: any = new Error('Failed to fetch');
    try { err.info = await res.json(); } catch {}
    err.status = res.status;
    throw err;
  }
  return res.json();
};

export default function VideoFeed() {
  const { data: videos, error, isLoading } = useSWR<VideoFromApi[]>('/api/feed', fetcher);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const slideRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // IntersectionObserver でアクティブスライドを決める（任意）
  useEffect(() => {
    // console.log(videos);
    if (!videos || videos.length === 0) return;
    const root = containerRef.current;
    if (!root) return;

    const options: IntersectionObserverInit = {
      root,
      rootMargin: '0px',
      threshold: 0.55,
    };

    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const idx = Number(entry.target.getAttribute('data-index'));
        if (entry.intersectionRatio >= 0.55) {
          setCurrentIndex(idx);
        }
      });
    }, options);

    slideRefs.current.forEach((el) => { if (el) obs.observe(el); });

    return () => obs.disconnect();
  }, [videos]);

  if (isLoading) return <div className="text-center text-white">Loading...</div>;
  if (error || !videos) return <div className="text-center text-red-500">Error loading feed</div>;
  if (videos.length === 0) return <div className="text-center text-white">No videos</div>;

  return (
    <div
      ref={containerRef}
      className="video-feed-container"
      // inline style で確実に上書き。これが無いとネイティブスクロールは発生しない
      style={{
        height: '100vh',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch', // iOS スムーススクロール
        scrollSnapType: 'y mandatory',
        touchAction: 'pan-y', // allow vertical pan
      }}
    >
      {videos.map((video, i) => (
        <div
          key={video.id}
          ref={(el) => (slideRefs.current[i] = el)}
          data-index={i}
          // 各スライドを画面高さに合わせ、スクロールスナップを効かせる
          style={{
            height: '100vh',
            scrollSnapAlign: 'start',
          }}
        >
          <Slide
            video={video}
            index={i}
            currentIndex={currentIndex}
            onRequestNext={() => {
              // optional programmatic scroll to next slide
              const next = Math.min(i + 1, videos.length - 1);
              const nextEl = slideRefs.current[next];
              if (nextEl) nextEl.scrollIntoView({ behavior: 'smooth' });
            }}
            onRequestPrev={() => {
              const prev = Math.max(i - 1, 0);
              const prevEl = slideRefs.current[prev];
              if (prevEl) prevEl.scrollIntoView({ behavior: 'smooth' });
            }}
          />
        </div>
      ))}
    </div>
  );
}
