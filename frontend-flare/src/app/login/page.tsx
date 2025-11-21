import { LoginForm } from "./LoginForm";

type LoginPageProps = {
  searchParams?: Promise<{ message?: string }>;
};

export default async function Login({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = await searchParams;
  const message = resolvedSearchParams?.message;

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0a0a] relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]" />

      <div className="w-full max-w-md p-8 space-y-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl relative z-10">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-500 to-purple-500 mb-4 shadow-lg shadow-blue-500/20">
            <span className="text-white font-bold text-2xl">R</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Welcome back
          </h1>
          <p className="text-gray-400 text-sm">
            Sign in to start swiping and sharing
          </p>
        </div>

        <LoginForm />

        {message && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-red-400 text-sm text-center font-medium">
              {message}
            </p>
          </div>
        )}

        <div className="text-center text-xs text-gray-500">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </div>
      </div>
    </div>
  );
}

