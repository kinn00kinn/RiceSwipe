// pages/api/auth/callback.ts
import { createServerClient, serialize } from "@supabase/ssr";
import { NextApiRequest, NextApiResponse } from "next";
export const runtime = "edge"; // 👈 この行を追記
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { code } = req.query;

  if (typeof code === "string") {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return req.cookies[name];
          },
          set(name, value, options) {
            // Use the serialize function from @supabase/ssr
            res.appendHeader("Set-Cookie", serialize(name, value, options));
          },
          remove(name, options) {
            // Use the serialize function from @supabase/ssr
            res.appendHeader("Set-Cookie", serialize(name, "", options));
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return res.redirect("/");
    }
  }

  // return the user to an error page with instructions
  return res.redirect("/auth/auth-code-error");
}
