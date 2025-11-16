// pages/index.tsx
"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import VideoFeed from "@/components/VideoFeed";
import Navigation from "@/components/Navigation";

export default function Home() {
  const { setSession } = useAuthStore();
  const supabase = createClient();

  useEffect(() => {
    // Set initial session and listen for auth state changes
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [supabase, setSession]);

  return (
    <div className="h-screen bg-black">
      <VideoFeed />
      <Navigation />
    </div>
  );
}
