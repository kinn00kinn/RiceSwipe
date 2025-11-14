// src/app/api/upload/sign/route.ts
import { r2 } from "@/src/lib/r2Client";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createId } from "@paralleldrive/cuid2"; // "getCuid" から "createId" に修正
import { uploadSignRequestSchema } from "@/src/lib/validators/upload";

// Prisma クライアントのインスタンスを作成
import { prisma } from "@/src/lib/prisma";
// const prisma = new PrismaClient();

// 10GB の制限値をバイト単位で定義
const STORAGE_LIMIT_BYTES = 10 * 1024 * 1024 * 1024; // 10 GB

export async function POST(request: Request) {
  const cookieStore = cookies();

  // ★★★ ここの渡し方を修正 ★★★
  const supabase = createRouteHandlerClient({
    cookies: () => cookieStore, // ✅ () => で包む
  });

  try {
    // 1. 認証チェック
    const {
      data: { user },
    } = await supabase.auth.getUser(); // ✅ これでエラーが消えるはず
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. リクエストボディのバリデーション (Zod)
    const body = await request.json();
    const validation = uploadSignRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues }, // "errors" から "issues" に修正
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
    const videoId = createId(); // "getCuid" から "createId" に修正
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
    // エラーが supabase クライアントの初期化で起きた場合、
    // ここではなく "unhandledRejection" としてキャッチされる
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
