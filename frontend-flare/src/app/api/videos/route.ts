import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { z } from "zod";

// POST: 動画メタデータとハッシュタグの保存
export async function POST(request: NextRequest) {
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return new NextResponse(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
    });
  }

  // Zodスキーマの定義
  const VideoUploadSchema = z.object({
    videoId: z.string().min(1, "Video ID is required"),
    objectKey: z.string().min(1, "Object key is required"),
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    originalUrl: z.string().url().optional().or(z.literal("")),
    hashtags: z.array(z.string()).optional(), // ハッシュタグ配列を受け取る
  });

  const validationResult = VideoUploadSchema.safeParse(body);

  if (!validationResult.success) {
    return new NextResponse(
      JSON.stringify({
        error: "Invalid request body",
        details: validationResult.error.flatten(),
      }),
      { status: 400 }
    );
  }

  const { videoId, objectKey, title, description, originalUrl, hashtags } =
    validationResult.data;

  // 1. 動画本体の保存
  const { data, error } = await supabase
    .from("videos")
    .insert({
      id: videoId,
      r2_object_key: objectKey,
      title: title,
      description: description,
      author_id: user.id,
      original_url: originalUrl || null, // 空文字ならnullにする
    })
    .select()
    .single();

  if (error) {
    console.error("Error inserting video metadata:", error);
    return new NextResponse(
      JSON.stringify({
        error: "Failed to save video metadata",
        details: error.message,
      }),
      { status: 500 }
    );
  }

  // 2. ハッシュタグの保存処理
  if (hashtags && hashtags.length > 0) {
    // 重複を除去
    const uniqueTags = Array.from(new Set(hashtags));

    for (const tag of uniqueTags) {
      if (!tag.trim()) continue;

      // A. hashtagsテーブルに登録 (既にあれば既存のIDを取得)
      const { data: tagData, error: tagError } = await supabase
        .from("hashtags")
        .upsert({ name: tag }, { onConflict: "name" })
        .select("id")
        .single();

      if (tagError) {
        console.error(`Error processing hashtag "${tag}":`, tagError);
        continue;
      }

      if (tagData) {
        // B. video_hashtagsテーブル (中間テーブル) に紐付け
        // 修正箇所: insertではなくupsertを使用し、重複時は無視する設定にする
        const { error: relationError } = await supabase
          .from("video_hashtags")
          .upsert(
            {
              video_id: videoId,
              hashtag_id: tagData.id,
            },
            {
              onConflict: "video_id,hashtag_id", // 複合主キーを指定
              ignoreDuplicates: true, // 重複時は無視（エラーにしない）
            }
          );

        if (relationError) {
          console.error(
            `Error linking hashtag "${tag}" to video:`,
            relationError
          );
        }
      }
    }
  }

  return NextResponse.json(data, { status: 201 });
}
