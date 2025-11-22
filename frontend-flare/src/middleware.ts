import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareClient } from "./lib/supabase/utils";

export async function middleware(request: NextRequest) {
  // --- [変更] 日本国外からのアクセス制限 ---
  // request.geo は型エラーの原因となるため削除し、Cloudflareのヘッダーのみを使用します
  const country = request.headers.get("CF-IPCountry");

  // 国コードが取得でき、かつ 'JP' (日本) でない場合は403エラーを返す
  // ※ ローカル環境(localhost)など国コードが取得できない場合はアクセスを許可します
  if (country && country !== 'JP') {
    return new NextResponse("Access denied: This service is only available in Japan.", { status: 403 });
  }
  // --------------------------------------

  const { supabase, response } = createMiddlewareClient(request);

  // [変更点] getSession() を getUser() に変更
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // --- New logic for pending users ---
  // [変更点] session を user に変更
  if (user) {
    const { data: userProfile, error } = await supabase
      .from("users")
      .select("status")
      .eq("id", user.id) // [変更点] session.user.id を user.id に変更
      .single();

    if (error) {
      console.error("Error fetching user profile in middleware:", error);
      // Handle error, maybe redirect to an error page or log out
      return NextResponse.redirect(new URL("/error", request.url));
    }

    if (
      userProfile?.status === "pending" &&
      request.nextUrl.pathname !== "/pending-approval"
    ) {
      // Redirect pending users to a specific page
      return NextResponse.redirect(new URL("/pending-approval", request.url));
    }
    // If user is pending and trying to access /pending-approval, allow it.
    // If user is not pending, allow access to other pages.
  }
  // --- End new logic ---

  // if user is not signed in and the current path is not /login,
  // redirect the user to the /login page
  // [変更点] session を user に変更
  if (!user && request.nextUrl.pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // if user is signed in and the current path is /login,
  // redirect the user to the home page
  // [変更点] session を user に変更
  if (user && request.nextUrl.pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - /auth/callback (Supabase auth callback)
     * - /pending-approval (The page where pending users are redirected)
     * - /auth/signout (The sign out route) [変更点]
     * - manifest.webmanifest (PWA manifest) [★追加]
     * - manifest.json (PWA manifest alias) [★追加]
     * - favicon.png (PWA icon) [★追加]
     */
    // [変更点] |auth/signout を追加
    "/((?!_next/static|_next/image|favicon.ico|favicon.png|auth/callback|pending-approval|auth/signout|manifest.webmanifest|manifest.json).*)",
  ],
};