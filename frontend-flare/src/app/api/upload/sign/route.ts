import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { z } from 'zod';

// export const runtime = 'edge';

export async function POST(request: NextRequest) {
  // Add defensive checks for environment variables
  if (
    !process.env.CLOUDFLARE_ACCOUNT_ID ||
    !process.env.R2_ACCESS_KEY_ID ||
    !process.env.R2_SECRET_ACCESS_KEY ||
    !process.env.R2_BUCKET_NAME
  ) {
    console.error('Error: Missing required R2 environment variables. Please check your .dev.vars file.');
    return new NextResponse(
      JSON.stringify({ error: 'Server configuration error: Missing R2 environment variables.' }),
      { status: 500 }
    );
  }

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
  const UploadSignSchema = z.object({
    filename: z.string().min(1, "Filename is required"),
    contentType: z.string().min(1, "ContentType is required"),
  });

  // Validate the request body using Zod
  const validationResult = UploadSignSchema.safeParse(body);

  if (!validationResult.success) {
    return new NextResponse(
      JSON.stringify({ error: 'Invalid request body', details: validationResult.error.flatten() }),
      { status: 400 }
    );
  }

  const { filename, contentType } = validationResult.data;

  const r2 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });

  const videoId = crypto.randomUUID();
  const objectKey = `videos/${user.id}/${videoId}/${filename}`;

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: objectKey,
    ContentType: contentType,
  });

  try {
    const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 3600 });

    return NextResponse.json({
      uploadUrl,
      videoId,
      objectKey,
    });
  } catch (error) {
    console.error('Error creating signed URL:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to create signed URL' }), { status: 500 });
  }
}
