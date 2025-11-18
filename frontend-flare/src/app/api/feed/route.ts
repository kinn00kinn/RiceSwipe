import { NextResponse } from "next/server";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// export const runtime = 'edge';

export async function GET() {
  // Per the Next.js error, we should await cookies()
  const cookieStore = await cookies();
  const supabase = createServerClient(
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

  try {
    const { data: { user } } = await supabase.auth.getUser();

    // Per the PostgREST error, we must specify the foreign key relationship
    const { data: videos, error: videosError } = await supabase
      .from("videos")
      .select(
        `
        id,
        title,
        description,
        r2ObjectKey:r2_object_key,
        author:users!videos_author_id_fkey(id, name),
        likes(count)
      `
      )
      .order("created_at", { ascending: false })
      .limit(20);

    if (videosError) throw videosError;

    if (!user) {
      const result = videos.map(v => ({
        ...v,
        likeCount: v.likes[0]?.count || 0,
        isLiked: false,
      }));
      return NextResponse.json(result);
    }

    const videoIds = videos.map(v => v.id);
    const { data: userLikes, error: likesError } = await supabase
      .from('likes')
      .select('video_id')
      .in('video_id', videoIds)
      .eq('user_id', user.id);

    if (likesError) throw likesError;

    const userLikedIds = new Set(userLikes.map(l => l.video_id));

    const finalVideos = videos.map(video => ({
      ...video,
      likeCount: video.likes[0]?.count || 0,
      isLiked: userLikedIds.has(video.id),
    }));

    return NextResponse.json(finalVideos);

  } catch (error) {
    console.error("Error fetching feed:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal Server Error", details: errorMessage },
      { status: 500 }
    );
  }
}
