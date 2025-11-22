import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { z } from "zod";

const ItemSchema = z.object({
  listId: z.string(),
  videoId: z.string(),
});

// 共通処理: Supabaseクライアントとユーザー認証
async function getSupabaseAndUser() {
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
  return { supabase, user };
}

// POST: アイテムをリストに追加
export async function POST(request: NextRequest) {
  const { supabase, user } = await getSupabaseAndUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const validation = ItemSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.flatten() },
      { status: 400 }
    );
  }

  const { listId, videoId } = validation.data;

  try {
    // 所有権確認
    const { data: listData, error: listError } = await supabase
      .from("lists")
      .select("id")
      .eq("id", listId)
      .eq("owner_id", user.id)
      .single();

    if (listError || !listData) {
      return NextResponse.json(
        { error: "List not found or permission denied" },
        { status: 404 }
      );
    }

    const { data: newItem, error: insertError } = await supabase
      .from("list_items")
      .insert({ list_id: listId, video_id: videoId })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json(
          { error: "Video already in list" },
          { status: 409 }
        );
      }
      throw insertError;
    }
    return NextResponse.json(newItem, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: アイテムをリストから削除
export async function DELETE(request: NextRequest) {
  const { supabase, user } = await getSupabaseAndUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const validation = ItemSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.flatten() },
      { status: 400 }
    );
  }

  const { listId, videoId } = validation.data;

  try {
    // 所有権確認
    const { data: listData, error: listError } = await supabase
      .from("lists")
      .select("id")
      .eq("id", listId)
      .eq("owner_id", user.id)
      .single();

    if (listError || !listData) {
      return NextResponse.json(
        { error: "List not found or permission denied" },
        { status: 404 }
      );
    }

    const { error: deleteError } = await supabase
      .from("list_items")
      .delete()
      .eq("list_id", listId)
      .eq("video_id", videoId);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
