import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { R2, R2_BUCKET_NAME } from '@/lib/r2';
import { createServerComponentClient } from '@/lib/supabase/utils';
import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient(cookieStore);
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 1. ユーザーが認証されているか確認
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { filename, contentType } = await request.json();

    if (!filename || !contentType) {
      return NextResponse.json({ error: 'Missing filename or contentType' }, { status: 400 });
    }

    // 2. 他のファイルと重複しないようにユニークなキーを生成
    const key = `${user.id}/${randomUUID()}-${filename}`;

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    // 3. R2へのアップロード用署名付きURLを生成 (有効期限60秒)
    const signedUrl = await getSignedUrl(R2, command, { expiresIn: 60 });

    return NextResponse.json({ signedUrl, key });
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
