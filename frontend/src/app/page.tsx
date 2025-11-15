"use client"; // クライアントコンポーネントとしてマーク

import { useEffect, useState } from "react";
import { supabase } from "@/src/lib/supabaseClient";
import type { Session } from "@supabase/supabase-js";
import Link from "next/link";

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: location.origin + "/api/auth/callback",
      },
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 animate-pulse">
        <div className="w-48 h-10 bg-gray-200 rounded-md"></div>
        <div className="w-64 h-6 bg-gray-200 rounded-md"></div>
        <div className="w-56 h-16 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-6 text-center">
      <h1 className="text-4xl font-bold">RiceSwipe</h1>
      <p className="text-lg text-gray-600">新しい動画体験を、ここから。</p>

      {session ? (
        <div className="w-full max-w-xs">
          <p className="mb-4">
            ようこそ, <br />
            <span className="font-semibold break-all">{session.user.email}</span>
          </p>
          <div className="space-y-4">
            <Link href="/swipe" className="block w-full px-6 py-3 text-lg font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                スワイプを始める
            </Link>
            <button
              onClick={handleLogout}
              className="w-full px-6 py-3 text-lg font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              ログアウト
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={handleLogin}
          className="px-8 py-4 text-xl font-semibold text-white bg-red-500 rounded-lg shadow-md hover:bg-red-600 transition-all duration-300 ease-in-out transform hover:scale-105"
        >
          Gmail でログイン
        </button>
      )}
    </div>
  );
}
