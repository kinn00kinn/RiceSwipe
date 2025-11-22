import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ videos: [] });
  }

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

  let data: any[] = [];
  let error = null;

  // ハッシュタグ検索かどうかの判定 (#で始まる場合)
  const isHashtagSearch = query.startsWith("#");
  const cleanQuery = query.replace("#", "");

  if (isHashtagSearch) {
    // --- ハッシュタグ検索 ---
    // 1. まずハッシュタグIDを取得
    const { data: hashtagData } = await supabase
      .from("hashtags")
      .select("id")
      .ilike("name", cleanQuery) // 大文字小文字を区別せず検索
      .single();

    if (hashtagData) {
      // 2. そのハッシュタグに関連する動画を取得
      // video_hashtags テーブルを検索し、紐づく videos を取得する
      const result = await supabase
        .from("video_hashtags")
        .select(
          `
          video:videos!inner (
            *,
            author:users!videos_author_id_fkey ( id, name ),
            video_hashtags (
              hashtag:hashtags ( id, name )
            )
          )
        `
        )
        .eq("hashtag_id", hashtagData.id)
        // 関連テーブル (videos) の created_at でソートする正しい構文
        .order("created_at", { foreignTable: "video", ascending: false })
        .limit(20);

      error = result.error;

      // 構造をフラットにする (video_hashtags配列 -> video配列)
      if (result.data) {
        data = result.data.map((item: any) => {
          const v = item.video;
          // ネストしたハッシュタグ情報を整形: video_hashtags配列 -> hashtags配列
          const tags = v.video_hashtags?.map((vh: any) => vh.hashtag) || [];
          // 不要なプロパティを除去して再構築
          const { video_hashtags, ...videoProps } = v;
          return { ...videoProps, hashtags: tags };
        });
      }
    } else {
      // 該当するハッシュタグが存在しない場合
      data = [];
    }
  } else {
    // --- 通常のキーワード検索 ---
    const result = await supabase
      .from("videos")
      .select(
        `
        *,
        author:users!videos_author_id_fkey ( id, name ),
        video_hashtags (
           hashtag:hashtags ( id, name )
        )
      `
      )
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .order("created_at", { ascending: false })
      .limit(20);

    error = result.error;

    if (result.data) {
      // ネストしたハッシュタグ情報を整形
      data = result.data.map((v: any) => {
        // video_hashtags配列 -> hashtags配列
        const tags = v.video_hashtags?.map((vh: any) => vh.hashtag) || [];
        // 不要なプロパティを除去して再構築
        const { video_hashtags, ...videoProps } = v;
        return { ...videoProps, hashtags: tags };
      });
    }
  }

  if (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // フロントエンド側で扱いやすい形式で返す
  return NextResponse.json({ videos: data || [] });
}
