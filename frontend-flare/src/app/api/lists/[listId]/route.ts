import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

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

// GET: Get list details and included videos
export async function GET(
  request: NextRequest,
  { params }: { params: { listId: string } }
) {
  const { supabase, user } = await getSupabaseAndUser();
  const { listId } = params;

  // Get list info
  const { data: list, error: listError } = await supabase
    .from("lists")
    .select("*")
    .eq("id", listId)
    .single();

  if (listError || !list) {
    return NextResponse.json({ error: "List not found" }, { status: 404 });
  }

  // Access control for private lists
  if (!list.is_public && list.owner_id !== user?.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Get videos in the list
  const { data: items, error: itemsError } = await supabase
    .from("list_items")
    .select(
      `
      video_id,
      video:videos (
        id,
        title,
        r2_object_key,
        original_url
      )
    `
    )
    .eq("list_id", listId)
    .order("created_at", { ascending: false });

  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  return NextResponse.json({ ...list, items });
}

// PATCH: Update list info
export async function PATCH(
  request: NextRequest,
  { params }: { params: { listId: string } }
) {
  const { supabase, user } = await getSupabaseAndUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { listId } = params;

  // Fix: Explicitly type the result of request.json()
  const body = (await request.json()) as { name?: string; isPublic?: boolean };

  const { error } = await supabase
    .from("lists")
    .update({
      name: body.name,
      is_public: body.isPublic,
    })
    .eq("id", listId)
    .eq("owner_id", user.id); // Owner only

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

// DELETE: Delete list
export async function DELETE(
  request: NextRequest,
  { params }: { params: { listId: string } }
) {
  const { supabase, user } = await getSupabaseAndUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { listId } = params;

  const { error } = await supabase
    .from("lists")
    .delete()
    .eq("id", listId)
    .eq("owner_id", user.id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
