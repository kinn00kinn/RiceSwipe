// src/lib/supabaseClient.ts
import { createBrowserClient } from "@supabase/ssr"; // ★ 変更

// ブラウザ（クライアントコンポーネント）用のSupabaseクライアントを作成
export const supabase = createBrowserClient( // ★ 変更
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);