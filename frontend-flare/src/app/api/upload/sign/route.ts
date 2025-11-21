import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { z } from "zod";

// ランタイム指定は標準のままでOK（NodeでもEdgeでも動く）ですが、
// 余計なトラブルを避けるなら edge 指定しておくと良いです。
// export const runtime = "edge";

export async function POST(request: NextRequest) {
  // 1. ユーザー認証
  const cookieStore = await cookies();
  // 環境変数の読み込み (process.env または getCloudflareContext どちらでも動くように)
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

  const schema = z.object({
    filename: z.string().min(1),
    contentType: z.string().min(1),
  });
  const validation = schema.safeParse(body);
  if (!validation.success)
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  // 3. ID生成
  const { filename, contentType } = validation.data;
  const videoId = crypto.randomUUID();
  const objectKey = `${user.id}/${videoId}/${filename}`;

  // 4. 【ここが重要】別で作った backend-signer に署名を依頼する
  // 環境変数からURLとキーを取得（設定されていない場合のハードコードは開発用）
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
        "X-Internal-Key": internalKey, // 合言葉をセット
      },
      body: JSON.stringify({ objectKey, contentType }),
    });

    if (!signerRes.ok) {
      throw new Error(await signerRes.text());
    }

    const { uploadUrl } = (await signerRes.json()) as { uploadUrl: string };

    // 成功！フロントエンドにURLを返す
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
