// src/app/api/upload/sign/route.ts
import { r2 } from "@/src/lib/r2Client";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createId } from "@paralleldrive/cuid2";
import { uploadSignRequestSchema } from "@/src/lib/validators/upload";
import { prisma } from "@/src/lib/prisma";

// 10GB の制限値をバイト単位で定義
const STORAGE_LIMIT_BYTES = 10 * 1024 * 1024 * 1024; // 10 GB

export async function POST(request: Request) {
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

  try {
    // 1. 認証チェック
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. リクエストボディのバリデーション (Zod)
    const body = await request.json();
    const validation = uploadSignRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues },
        { status: 400 }
      );
    }
    const { fileSize, contentType } = validation.data;

    // 3. 全体容量チェック
    const storageUsage = await prisma.video.aggregate({
      _sum: {
        fileSizeInBytes: true,
      },
    });

    const currentUsage = storageUsage._sum.fileSizeInBytes ?? BigInt(0);
    const newUsage = currentUsage + BigInt(fileSize);

    if (newUsage > BigInt(STORAGE_LIMIT_BYTES)) {
      console.warn(
        `Storage limit exceeded. User: ${user.id}, New usage: ${newUsage}`
      );
      return NextResponse.json(
        { error: "ストレージの空き容量がありません (10GBの上限を超えます)" },
        { status: 413 }
      );
    }

    // 4. ユニークなオブジェクトキーを生成
    const videoId = createId();
    const extension = contentType.split("/")[1];
    const objectKey = `${user.id}/${videoId}/original.${extension}`;
    const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!;

    // 5. 署名付きURLを生成
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: objectKey,
      ContentType: contentType,
      ContentLength: fileSize,
    });
    const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 3600 });

    // 6. URLとvideoIdをクライアントに返す
    return NextResponse.json({
      uploadUrl: uploadUrl,
      videoId: videoId,
      objectKey: objectKey,
    });
  } catch (error) {
    console.error("Upload sign error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
