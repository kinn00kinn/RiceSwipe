// src/components/layouts/Header.tsx
"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/src/lib/supabaseClient";
import type { User } from "@supabase/supabase-js"; // ★ User 型をインポート
import Link from "next/link"; // ★ Link をインポート

export const Header = () => {
  // ★ ログインしているユーザーの情報を保持する state
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // ★ 1. ページ読み込み時に現在のセッション（ログイン状態）を取得
    const getCurrentUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    getCurrentUser();

    // ★ 2. 認証状態（ログイン、ログアウト）が変化したら自動で検知
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    // ★ クリーンアップ処理
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Gmail (Google) OAuth ログイン
  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // ★ 認証後に /api/auth/callback にリダイレクトさせる
        redirectTo: `${location.origin}/api/auth/callback`,
      },
    });
  };

  // ログアウト
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header /* ... */>
      <div className="container flex h-16 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="font-bold">
          {" "}
          {/* ★ Link に変更 */}
          RiceSwipe
        </Link>
        <div>
          {user ? (
            // ログインしている場合
            <div className="flex items-center gap-4">
              {" "}
              {/* ★ gap-4 を追加 */}
              {/* ★ アップロードリンクを追加 */}
              <Link
                href="/upload"
                className="text-sm font-medium hover:underline"
              >
                アップロード
              </Link>
              <button
                onClick={handleLogout}
                className="rounded bg-red-500 px-4 py-2 font-bold text-white hover:bg-red-700"
              >
                ログアウト
              </button>
            </div>
          ) : (
            // ログインしていない場合
            <button
              onClick={handleLogin}
              className="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
            >
              Gmailでログイン
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
