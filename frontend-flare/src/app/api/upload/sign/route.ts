import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { z } from "zod";

// export const runtime = "edge"; // 推奨

export async function POST(request: NextRequest) {
  // 1. ユーザー認証
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Server Config Error" }, { status: 500 });
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: { get: (name) => cookieStore.get(name)?.value },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 2. リクエスト検証
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // ★修正ポイント1: スキーマに turnstileToken を追加
  const schema = z.object({
    filename: z.string().min(1),
    contentType: z.string().min(1),
    turnstileToken: z.string().min(1), // これがないと検証ではじかれるか、無視されます
  });

  const validation = schema.safeParse(body);
  if (!validation.success)
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  // ★修正ポイント2: 変数を取り出す
  const { filename, contentType, turnstileToken } = validation.data;

  const videoId = crypto.randomUUID();
  const objectKey = `${user.id}/${videoId}/${filename}`;

  // 3. バックエンド署名サービスへリクエスト
  const signerUrl = process.env.SIGNER_WORKER_URL;
  const internalKey = process.env.INTERNAL_API_KEY;

  if (!signerUrl || !internalKey) {
    console.error("Missing SIGNER_WORKER_URL or INTERNAL_API_KEY");
    return NextResponse.json({ error: "Server Config Error" }, { status: 500 });
  }

  try {
    const signerRes = await fetch(signerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Key": internalKey,
      },
      // ★修正ポイント3: body に turnstileToken を含めて転送する
      body: JSON.stringify({
        objectKey,
        contentType,
        turnstileToken,
      }),
    });

    if (!signerRes.ok) {
      // ここで "Turnstile token is missing" というエラーをキャッチしていました
      throw new Error(await signerRes.text());
    }

    const { uploadUrl } = (await signerRes.json()) as { uploadUrl: string };

    return NextResponse.json({
      uploadUrl,
      videoId,
      objectKey,
    });
  } catch (error) {
    console.error("Signer Service Error:", error);
    return NextResponse.json({ error: "Failed to sign URL" }, { status: 500 });
  }
}
