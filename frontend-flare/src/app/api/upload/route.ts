// src/app/api/upload/route.ts
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { R2, R2_BUCKET_NAME } from "@/lib/r2";
import { createServerComponentClient } from "@/lib/supabase/utils";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

export async function POST(request: Request) {
  // 1. Supabaseクライアントの初期化と認証チェック
  const supabase = await createServerComponentClient();

  const {
    data: { user },
    error: getUserError,
  } = await supabase.auth.getUser();

  if (getUserError || !user) {
    console.error("Auth error:", getUserError);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 2. リクエストボディの解析
    const body = await request.json();

    // 型ガードと入力検証
    const { filename, contentType, title, description } = body as {
      filename?: string;
      contentType?: string;
      title?: string;
      description?: string;
    };

    if (!filename || !contentType) {
      return NextResponse.json(
        { error: "Missing filename or contentType" },
        { status: 400 }
      );
    }

    // 3. IDとオブジェクトキーの生成 (Python版のロジックに合わせる)
    // 形式: {user_id}/{video_id}/{filename}
    const videoId = randomUUID();
    const objectKey = `${user.id}/${videoId}/${filename}`;

    // 4. Supabaseへのメタデータ保存 (Python版のロジックを再現)
    // Note: アップロード前にDBにレコードを作ることで、IDを確定させます
    const { error: dbError } = await supabase.from("videos").insert({
      id: videoId,
      r2_object_key: objectKey,
      title: title || filename.split(".")[0], // タイトルがない場合はファイル名(拡張子なし)
      description: description || null,
      author_id: user.id,
    });

    if (dbError) {
      console.error("Supabase Insert Error:", dbError);
      return NextResponse.json(
        { error: "Failed to save video metadata" },
        { status: 500 }
      );
    }

    // 5. R2へのアップロード用署名付きURL生成
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: objectKey,
      ContentType: contentType,
      // 必要に応じてACLやMetadataを追加
    });

    // 有効期限は600秒(10分)など、アップロード時間に合わせて調整してください
    const signedUrl = await getSignedUrl(R2, command, { expiresIn: 600 });

    // 6. クライアントへのレスポンス
    return NextResponse.json({
      success: true,
      signedUrl,
      key: objectKey,
      videoId: videoId, // フロントエンドでリダイレクトなどに使用
    });
  } catch (error) {
    console.error("Upload setup error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
