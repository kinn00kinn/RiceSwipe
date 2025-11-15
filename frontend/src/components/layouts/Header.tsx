// src/components/layouts/Header.tsx
import Link from 'next/link';

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-10 bg-white/80 backdrop-blur-sm shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-md">
        <Link href="/" className="text-2xl font-bold text-gray-800 hover:text-gray-600 transition-colors">
          RiceSwipe
        </Link>
        <div>
          {/* Future user profile icon */}
        </div>
      </div>
    </header>
  );
};

export default Header;