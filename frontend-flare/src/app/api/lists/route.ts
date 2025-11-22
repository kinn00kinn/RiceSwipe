import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { z } from "zod";

// POST: 新しいリストを作成
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

  const CreateListSchema = z.object({
    name: z.string().min(1, "List name is required"),
    isPublic: z.boolean().optional().default(false),
  });

  const validation = CreateListSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const { name, isPublic } = validation.data;

  const { data, error } = await supabase
    .from("lists")
    .insert({
      name,
      is_public: isPublic,
      owner_id: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error("List creation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

// GET: 自分のリスト一覧を取得 (videoIdがある場合は登録状況も含める)
export async function GET(request: NextRequest) {
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

  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get("videoId");

  // 1. 自分のリストを取得
  const { data: lists, error } = await supabase
    .from("lists")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 2. videoId が指定されている場合、各リストにその動画が入っているか確認
  if (videoId && lists.length > 0) {
    const listIds = lists.map((l) => l.id);

    // list_items テーブルを検索
    const { data: items, error: itemsError } = await supabase
      .from("list_items")
      .select("list_id")
      .eq("video_id", videoId)
      .in("list_id", listIds);

    if (!itemsError && items) {
      const addedListIds = new Set(items.map((i) => i.list_id));

      const listsWithStatus = lists.map((list) => ({
        ...list,
        hasVideo: addedListIds.has(list.id),
      }));

      return NextResponse.json(listsWithStatus);
    }
  }

  return NextResponse.json(lists.map((l) => ({ ...l, hasVideo: false })));
}
