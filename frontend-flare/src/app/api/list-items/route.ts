import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { z } from "zod";

// POST: アイテムをリストに追加
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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const AddItemSchema = z.object({
    listId: z.string(), // CUIDチェックはSupabase側で行うため緩める
    videoId: z.string(),
  });

  const validation = AddItemSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json({ error: validation.error.flatten() }, { status: 400 });
  }

  const { listId, videoId } = validation.data;

  try {
    // 1. ユーザーがそのリストの所有者であるかを確認
    const { data: listData, error: listError } = await supabase
      .from("lists")
      .select("id")
      .eq("id", listId)
      .eq("owner_id", user.id)
      .single();

    if (listError || !listData) {
      return NextResponse.json({ error: "List not found or you do not have permission" }, { status: 404 });
    }

    // 2. list_items テーブルにデータを挿入
    const { data: newItem, error: insertError } = await supabase
      .from("list_items")
      .insert({
        list_id: listId,
        video_id: videoId,
      })
      .select()
      .single();

    if (insertError) {
      // PostgreSQLのユニーク制約違反エラーコード
      if (insertError.code === '23505') {
        return NextResponse.json({ error: "This video is already in the list" }, { status: 409 });
      }
      // その他のDBエラー
      throw insertError;
    }

    return NextResponse.json(newItem, { status: 201 });

  } catch (error: any) {
    console.error("Failed to add item to list:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}