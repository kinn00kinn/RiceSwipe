import { createServerComponentClient } from "@/lib/supabase/utils";
import { NextResponse } from "next/server";

// Cloudflare Workersで動作させるために必須
// export const runtime = "edge";

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
    const { filename, contentType, title, description, originalUrl } = body as {
      filename?: string;
      contentType?: string;
      title?: string;
      description?: string;
      originalUrl?: string;
    };

    if (!filename || !contentType) {
      return NextResponse.json(
        { error: "Missing filename or contentType" },
        { status: 400 }
      );
    }

    // 3. IDとオブジェクトキーの生成
    // Edge環境対応のためグローバルの crypto.randomUUID() を使用
    const videoId = crypto.randomUUID();
    const objectKey = `${user.id}/${videoId}/${filename}`;

    // 4. Supabaseへのメタデータ保存
    const { error: dbError } = await supabase.from("videos").insert({
      id: videoId,
      r2_object_key: objectKey,
      title: title || filename.split(".")[0],
      description: description || null,
      author_id: user.id,
      original_url: originalUrl || null, // originalUrlを保存
    });

    if (dbError) {
      console.error("Supabase Insert Error:", dbError);
      return NextResponse.json(
        { error: "Failed to save video metadata" },
        { status: 500 }
      );
    }

    // 5. 【修正】backend-signer に署名を依頼
    // AWS SDKを直接使わず、外部の署名用ワーカーを呼び出す
    const signerUrl = process.env.SIGNER_WORKER_URL; 
    const internalKey = process.env.INTERNAL_API_KEY;

    if (!signerUrl || !internalKey) {
        console.error("Server Config Error: Missing signer vars");
        return NextResponse.json({ error: "Server Config Error" }, { status: 500 });
    }

    const signerRes = await fetch(signerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Key": internalKey,
      },
      body: JSON.stringify({ 
        objectKey, 
        contentType,
        originalUrl // R2メタデータ用にも渡す
      }),
    });

    if (!signerRes.ok) {
      const errText = await signerRes.text();
      console.error("Signer Error:", errText);
      throw new Error("Failed to get signed URL");
    }

    const { uploadUrl } = await signerRes.json() as { uploadUrl: string };

    // 6. クライアントへのレスポンス
    return NextResponse.json({
      success: true,
      signedUrl: uploadUrl, // 変数名を合わせて返す
      key: objectKey,
      videoId: videoId,
    });

  } catch (error) {
    console.error("Upload setup error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}