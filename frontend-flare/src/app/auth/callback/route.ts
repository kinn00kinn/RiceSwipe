// 例: src/app/auth/callback/route.ts
import { createServerComponentClient } from "@/lib/supabase/utils";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get("next") ?? "/";

  if (code) {
    // createServerComponentClient は引数を取らない実装に合わせる
    const supabase = await createServerComponentClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Get the user from the session
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Check if the user exists in the public.users table
        const { data: existingUser, error: fetchError } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .single();

        if (fetchError && fetchError.code === 'PGRST116') { // No rows found
          // User does not exist in public.users, insert them with pending status
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: user.id,
              email: user.email,
              name: user.user_metadata?.full_name || user.email,
              status: 'pending',
            });

          if (insertError) {
            console.error('Error inserting new user into public.users:', insertError);
            return NextResponse.redirect(`${origin}/auth/auth-code-error?message=Failed to create user profile`);
          } else {
            console.log('New user inserted into public.users with pending status:', user.id);
          }
        } else if (fetchError) {
          console.error('Error fetching user from public.users:', fetchError);
          return NextResponse.redirect(`${origin}/auth/auth-code-error?message=Failed to check user profile`);
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
