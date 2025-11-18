import { createClient } from '@supabase/supabase-js';

// process.env から環境変数を取得
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase URL or Anon Key');
}

// Supabase クライアントを作成
// このクライアントは内部で 'fetch' を使うため Edge Runtime で安全に動作する
export const supabase = createClient(supabaseUrl, supabaseAnonKey);