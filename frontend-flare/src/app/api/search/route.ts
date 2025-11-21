import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ videos: [] });
  }

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

  // PostgREST syntax for ILIKE (case-insensitive search) on title or description
  // or logic: title.ilike.%query%,description.ilike.%query%
  const { data: videos, error } = await supabase
    .from("videos")
    .select(
      `
      *,
      author:users!videos_author_id_fkey ( id, name )
    `
    )
    .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Note: In a real production app, you would also fetch like counts and isLiked status here,
  // similar to the feed API. For simplicity in search results, we return basic video data.
  const videosWithMeta = videos.map((v) => ({
    ...v,
    likeCount: 0, // Search results simplify this for now
    isLiked: false,
  }));

  return NextResponse.json(videosWithMeta);
}
