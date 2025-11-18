import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export const runtime = 'edge';

// Helper to create Supabase client
const createSupabaseClient = () => {
  const cookieStore = cookies();
  return createServerClient(
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
};

// POST handler for liking a video
export async function POST(request: NextRequest, { params }: { params: { videoId: string } }) {
  const videoId = params.videoId;
  const supabase = createSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  if (!videoId) {
    return new NextResponse(JSON.stringify({ error: 'Video ID is required' }), { status: 400 });
  }

  const { error } = await supabase.from('likes').insert({
    user_id: user.id,
    video_id: videoId,
  });

  if (error) {
    // Handle potential duplicate like (primary key violation)
    if (error.code === '23505') {
      return new NextResponse(JSON.stringify({ message: 'Already liked' }), { status: 200 });
    }
    console.error('Error liking video:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to like video' }), { status: 500 });
  }

  return new NextResponse(JSON.stringify({ message: 'Video liked' }), { status: 201 });
}

// DELETE handler for unliking a video
export async function DELETE(request: NextRequest, { params }: { params: { videoId: string } }) {
  const videoId = params.videoId;
  const supabase = createSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  if (!videoId) {
    return new NextResponse(JSON.stringify({ error: 'Video ID is required' }), { status: 400 });
  }

  const { error } = await supabase
    .from('likes')
    .delete()
    .match({ user_id: user.id, video_id: videoId });

  if (error) {
    console.error('Error unliking video:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to unlike video' }), { status: 500 });
  }

  return new NextResponse(JSON.stringify({ message: 'Video unliked' }), { status: 200 });
}
