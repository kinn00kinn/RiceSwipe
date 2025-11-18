import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  const cookieStore = cookies();
  // Use the same Supabase client setup as the /sign route for consistency
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return new NextResponse(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  const { videoId, objectKey, title, description } = body;

  if (!videoId || !objectKey || !title) {
    return new NextResponse(JSON.stringify({ error: 'videoId, objectKey, and title are required' }), { status: 400 });
  }

  // The documentation requires postgres.js, but it's not installed.
  // Falling back to supabase-js to insert data, respecting the user's
  // request not to add new packages.
  const { data, error } = await supabase
    .from('videos')
    .insert({
      id: videoId,
      r2_object_key: objectKey,
      title: title,
      description: description,
      author_id: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Error inserting video metadata:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to save video metadata', details: error.message }), { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
