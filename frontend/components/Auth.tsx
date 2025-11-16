// components/Auth.tsx
"use client";

import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

export default function Auth({ user }: { user: User | null }) {
  const supabase = createClient();

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/api/auth/callback`,
      },
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (user) {
    return (
      <div className="space-y-4 text-center">
        <div>
          <p className="text-lg font-semibold text-green-600">
            ログイン済みです
          </p>
          <p className="text-sm text-gray-600">Email: {user.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
        >
          ログアウト
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleLogin}
      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
    >
      Gmailでログイン
    </button>
  );
}
