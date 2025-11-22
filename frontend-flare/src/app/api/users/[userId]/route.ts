import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// GET: ユーザープロフィール取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> } // 1. Type as Promise
) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );

  const { userId } = await params; // 2. Await params

  // 1. ユーザー基本情報
  const { data: user, error } = await supabase
    .from("users")
    .select("id, name, created_at")
    .eq("id", userId)
    .single();

  if (error || !user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // 2. 投稿動画
  const { data: videos } = await supabase
    .from("videos")
    .select("id, title, r2_object_key")
    .eq("author_id", userId)
    .order("created_at", { ascending: false });

  // 3. いいねした動画 (本来はプライバシー設定などで制御すべき)
  const { data: likes } = await supabase
    .from("likes")
    .select("video:videos(id, title)")
    .eq("user_id", userId);

  const likedVideos = likes?.map((l: any) => l.video) || [];

  return NextResponse.json({
    ...user,
    videos: videos || [],
    likedVideos,
    stats: {
      posts: videos?.length || 0,
      likes: likedVideos.length,
    },
  });
}