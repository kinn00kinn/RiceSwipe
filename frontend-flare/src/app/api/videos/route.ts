import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { z } from 'zod'; // Added Zod import



export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  // Use the same Supabase client setup as the /sign route for consistency
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
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return new NextResponse(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  // Define Zod schema for the request body
  const VideoUploadSchema = z.object({
    videoId: z.string().min(1, "Video ID is required"),
    objectKey: z.string().min(1, "Object key is required"),
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(), // Description is optional
  });

  // Validate the request body using Zod
  const validationResult = VideoUploadSchema.safeParse(body);

  if (!validationResult.success) {
    return new NextResponse(
      JSON.stringify({ error: 'Invalid request body', details: validationResult.error.flatten() }),
      { status: 400 }
    );
  }

  const { videoId, objectKey, title, description } = validationResult.data;

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
