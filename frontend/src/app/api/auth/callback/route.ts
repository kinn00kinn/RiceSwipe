// src/app/api/auth/callback/route.ts
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    // ★★★ 修正点: cookies() をハンドラのトップレベルで呼び出す ★★★
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            // ★ cookieStore 変数を参照する
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            // ★ cookieStore 変数を参照する
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            // ★ cookieStore 変数を参照する
            cookieStore.delete({ name, ...options });
          },
        },
      }
    );

    await supabase.auth.exchangeCodeForSession(code);
  }

  // 認証後、ホームページにリダイレクト
  return NextResponse.redirect(requestUrl.origin);
}
