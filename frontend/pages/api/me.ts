// pages/api/me.ts
import { createServerClient, serialize } from "@supabase/ssr";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // This is a protected route.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => req.cookies[name],
        set: (name, value, options) => {
          res.appendHeader("Set-Cookie", serialize(name, value, options));
        },
        remove: (name, options) => {
          res.appendHeader("Set-Cookie", serialize(name, "", options));
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return res.status(401).json({ error: "Unauthorized: You must be logged in." });
  }

  // Return the user object
  return res.status(200).json(user);
}
