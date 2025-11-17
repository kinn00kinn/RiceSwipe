// app/login/page.tsx
import { createServerComponentClient } from "@/lib/supabase/utils";
import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { PageProps } from "next";

export default async function Login(props: PageProps<"/login">) {
  // Next 15 では searchParams が Promise なので await して中身を取得する
  const searchParams = await props.searchParams;
  const messageParam = searchParams?.message;
  const message = Array.isArray(messageParam)
    ? messageParam.join(",")
    : messageParam;

  const signInWithGoogle = async () => {
    "use server";

    const origin = headers().get("origin");
    const supabase = createServerComponentClient();

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

    return redirect((data as { url?: string }).url ?? "/");
  };

  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2">
      <form action={signInWithGoogle}>
        <button className="w-full bg-red-600 hover:bg-red-700 rounded-md px-4 py-2 text-white mb-2 transition-colors">
          Sign In with Google
        </button>
      </form>

      {message && (
        <p className="mt-4 p-4 bg-red-100 text-red-700 text-center rounded-md">
          {message}
        </p>
      )}
    </div>
  );
}
