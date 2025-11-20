"use server";

import { createServerComponentClient } from "@/lib/supabase/utils";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const signInWithGoogle = async () => {
  const origin = (await headers()).get("origin");
  const supabase = await createServerComponentClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    console.error(error);
    return redirect("/login?message=Could not authenticate with Google");
  }

  return redirect(data.url);
};
