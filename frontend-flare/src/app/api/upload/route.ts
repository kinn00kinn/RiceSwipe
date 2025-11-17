// src/app/api/upload/route.ts
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { R2, R2_BUCKET_NAME } from "@/lib/r2";
import { createServerComponentClient } from "@/lib/supabase/utils";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

export async function POST(request: Request) {
  // createServerComponentClient は引数なしで使う実装に合わせる
  const supabase = await createServerComponentClient();

  const {
    data: { user },
    error: getUserError,
  } = await supabase.auth.getUser();

  if (getUserError) {
    console.error("supabase.getUser error:", getUserError);
    return NextResponse.json({ error: getUserError.message }, { status: 500 });
  }

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // request.json() の戻りは unknown なので安全に扱う
    const body: unknown = await request.json();

    if (typeof body !== "object" || body === null) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // 型ガード
    const filename = (body as Record<string, unknown>).filename;
    const contentType = (body as Record<string, unknown>).contentType;

    if (typeof filename !== "string" || typeof contentType !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid filename or contentType" },
        { status: 400 }
      );
    }

    // 2. 他のファイルと重複しないようにユニークなキーを生成
    const key = `${user.id}/${randomUUID()}-${filename}`;

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    // 3. R2へのアップロード用署名付きURLを生成 (有効期限60秒)
    const signedUrl = await getSignedUrl(R2, command, { expiresIn: 60 });

    return NextResponse.json({ signedUrl, key });
  } catch (error) {
    console.error("Error generating signed URL:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
