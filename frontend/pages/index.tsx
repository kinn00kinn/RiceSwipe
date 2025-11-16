// pages/index.tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import Auth from "@/components/Auth";
import VideoFeed from "@/components/VideoFeed";
import UploadForm from "@/components/UploadForm";
import Profile from "@/components/Profile";
import Debug from "@/components/Debug";

export default function Home() {
  const { session, user, setSession } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // 1. Set initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // 3. Unsubscribe on cleanup
    return () => subscription.unsubscribe();
  }, [supabase, setSession]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10 space-y-8">
      <header className="w-full max-w-md mx-auto">
        <div className="p-4 bg-white rounded-lg shadow-md flex justify-between items-center">
          <h1 className="text-2xl font-bold">RiceSwipe</h1>
          {loading ? <p>...</p> : <Auth user={user} />}
        </div>
      </header>

      <main className="w-full max-w-md mx-auto space-y-8">
        <Profile />
        <UploadForm />
        <VideoFeed />
        <Debug />
      </main>
    </div>
  );
}
