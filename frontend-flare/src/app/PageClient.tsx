"use client";

import VideoFeed from "./components/VideoFeed";
import { Button } from "./components/ui/Button";
import type { User } from "@supabase/supabase-js";

interface PageClientProps {
  user: User;
}

export default function PageClient({ user }: PageClientProps) {
  // The signOut action is passed via a form, so it doesn't need to be defined here.

  return (
    <div className="w-full h-screen bg-black">
      <header className="fixed top-0 left-0 w-full z-10">
        <div className="w-full max-w-4xl mx-auto flex justify-between items-center p-3 text-sm">
          <div className="font-semibold text-lg text-white">RiceSwipe</div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-white">Hey, {user.email}</span>
            <form action="/auth/signout" method="post">
              <Button variant="ghost" className="text-white">
                Logout
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="w-full h-full">
        <VideoFeed />
      </main>
    </div>
  );
}
