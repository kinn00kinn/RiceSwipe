"use client";

import { createServerComponentClient } from "@/lib/supabase/utils";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Button } from "../components/ui/Button";
import { useState } from "react";
import { Turnstile } from "@marsidev/react-turnstile";

type LoginPageProps = {
  searchParams?: { message?: string };
};

const GoogleIcon = () => (
  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

// Server Action for Google Sign-In
const signInWithGoogle = async () => {
  "use server";

  const origin = (await headers()).get("origin");
  const supabase = await createServerComponentClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    console.error(error);
    return redirect("/login?message=Could not authenticate with Google");
  }

  return redirect(data.url);
};

export default function Login({ searchParams }: LoginPageProps) {
  const [token, setToken] = useState<string | null>(null);
  const message = searchParams?.message;

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0a0a] relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]" />

      <div className="w-full max-w-md p-8 space-y-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl relative z-10">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-500 to-purple-500 mb-4 shadow-lg shadow-blue-500/20">
            <span className="text-white font-bold text-2xl">R</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Welcome back
          </h1>
          <p className="text-gray-400 text-sm">
            Sign in to start swiping and sharing
          </p>
        </div>

        <form action={signInWithGoogle} className="space-y-6">
          <Button
            variant="default"
            size="lg"
            className="w-full h-12 bg-white hover:bg-gray-100 text-gray-900 font-medium border border-gray-200 transition-all hover:shadow-lg hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
            disabled={!token}
          >
            <GoogleIcon />
            Continue with Google
          </Button>

          <Turnstile
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
            onSuccess={setToken}
            onExpire={() => setToken(null)}
            onError={() => setToken(null)}
            options={{
              theme: "dark",
            }}
            className="mx-auto"
          />
        </form>

        {message && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-red-400 text-sm text-center font-medium">
              {message}
            </p>
          </div>
        )}

        <div className="text-center text-xs text-gray-500">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </div>
      </div>
    </div>
  );
}
