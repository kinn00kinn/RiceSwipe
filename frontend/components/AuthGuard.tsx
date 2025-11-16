// components/AuthGuard.tsx
"use client";

import { useAuthStore } from "@/stores/authStore";
import Auth from "./Auth";
import type { User } from "@supabase/supabase-js";
import Navigation from "./Navigation";

interface AuthGuardProps {
  children: (user: User) => React.ReactNode;
}

/**
 * A component that guards a page, requiring authentication to view.
 * If the user is not logged in, it displays a login prompt.
 * Otherwise, it renders the children.
 */
export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, session } = useAuthStore();

  // While the session is being loaded, show a loading indicator.
  // Note: `session` is `null` if not logged in, `undefined` if loading.
  if (session === undefined) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>セッションを読み込み中...</p>
      </div>
    );
  }

  // If the user is not logged in, show the login UI.
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex flex-col items-center justify-center h-screen p-4 max-w-md mx-auto">
          <h1 className="text-xl font-bold mb-4">ログインが必要です</h1>
          <p className="text-gray-600 mb-8 text-center">
            この機能を利用するにはログインしてください。
          </p>
          <Auth user={null} />
        </div>
        <Navigation />
      </div>
    );
  }

  // If the user is authenticated, render the protected content.
  return <>{children(user)}</>;
}
