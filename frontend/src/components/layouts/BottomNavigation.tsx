// src/components/layouts/BottomNavigation.tsx
import Link from 'next/link';

const HomeIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
);

const SwipeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
  </svg>
);

const UploadIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
);

const BottomNavigation = () => {
  // TODO: Add active link styling
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-10 bg-white/80 backdrop-blur-sm border-t">
      <div className="container mx-auto h-16 flex items-center justify-around max-w-md">
        <Link href="/" className="flex flex-col items-center text-gray-600 hover:text-gray-900 transition-colors">
          <HomeIcon className="h-6 w-6" />
          <span className="text-xs mt-1">Home</span>
        </Link>
        <Link href="/swipe" className="flex flex-col items-center text-gray-600 hover:text-gray-900 transition-colors">
          <SwipeIcon className="h-6 w-6" />
          <span className="text-xs mt-1">Swipe</span>
        </Link>
        <Link href="/upload" className="flex flex-col items-center text-gray-600 hover:text-gray-900 transition-colors">
          <UploadIcon className="h-6 w-6" />
          <span className="text-xs mt-1">Upload</span>
        </Link>
      </div>
    </footer>
  );
};

export default BottomNavigation;
