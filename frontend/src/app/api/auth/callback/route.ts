// src/app/api/auth/callback/route.ts
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    // 認証コードをセッションに交換
    const cookieStore = cookies();

    // ★★★ ここの渡し方を修正 ★★★
    const supabase = createRouteHandlerClient({
      cookies: () => cookieStore, // ✅ () => で包む
    });

    await supabase.auth.exchangeCodeForSession(code);
  }

  // 認証後、ホームページにリダイレクト
  return NextResponse.redirect(requestUrl.origin);
}
