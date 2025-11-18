import { createServerComponentClient } from "@/lib/supabase/utils";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Button } from "../components/ui/Button";

// Define the props type for the async component
type LoginPageProps = {
  searchParams?: { message?: string };
};

// Google Icon SVG component
const GoogleIcon = () => (
  <svg className="w-5 h-5 mr-2" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
    <path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 111.8 512 0 400.2 0 261.8 0 123.8 111.8 12.8 244 12.8c70.3 0 129.8 27.8 174.3 71.9l-64.4 64.4C325.8 119.9 289.3 99.8 244 99.8c-66.8 0-121.4 54.6-121.4 121.4s54.6 121.4 121.4 121.4c74.2 0 104.5-52.2 108.6-77.5H244V241.2h238.8c2.4 12.4 3.2 25.3 3.2 38.6z"></path>
  </svg>
);

export default async function Login({ searchParams }: LoginPageProps) {
  const message = searchParams?.message;

  const signInWithGoogle = async () => {
    "use server";

    const origin = headers().get("origin");
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

  return (
    <div className="w-full h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="w-full max-w-sm p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg text-center">
        <div>
          <h1 className="text-3xl font-bold text-white">RiceSwipe</h1>
          <p className="mt-2 text-gray-400">Sign in to continue</p>
        </div>
        
        <form action={signInWithGoogle}>
          <Button variant="default" size="lg" className="w-full">
            <GoogleIcon />
            Sign In with Google
          </Button>
        </form>

        {message && (
          <p className="mt-4 p-4 bg-red-900/50 text-red-300 text-center rounded-md border border-red-800">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
