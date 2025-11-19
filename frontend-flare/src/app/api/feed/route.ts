import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  const supabase = await createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  // 1. 動画リストを取得
  // videos_author_id_fkey を明示して、likesテーブル経由の関係と区別します
  const { data: videos, error } = await supabase
    .from("videos")
    .select(
      `
      id,
      title,
      description,
      r2_object_key,
      original_url,
      created_at,
      author:users!videos_author_id_fkey ( id, name )
    `
    )
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Feed fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 2. ユーザーのいいね情報を取得 (ログインしている場合)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let userLikes = new Set<string>();

  if (user) {
    const { data: likes } = await supabase
      .from("likes")
      .select("video_id")
      .eq("user_id", user.id);

    if (likes) {
      likes.forEach((l) => userLikes.add(l.video_id));
    }
  }

  // 3. データを整形して返す
  const safeVideos = videos || [];

  const result = await Promise.all(
    safeVideos.map(async (v) => {
      // いいね数を取得
      const { count } = await supabase
        .from("likes")
        .select("*", { count: "exact", head: true })
        .eq("video_id", v.id);

      // author が配列で返ってくる場合のハンドリング
      const authorData = Array.isArray(v.author) ? v.author[0] : v.author;

      return {
        id: v.id,
        title: v.title,
        description: v.description,
        r2ObjectKey: v.r2_object_key,
        originalUrl: v.original_url,
        author: authorData || { id: "unknown", name: "Unknown" },
        createdAt: v.created_at,
        likeCount: count || 0,
        isLiked: userLikes.has(v.id),
      };
    })
  );

  return NextResponse.json(result);
}
