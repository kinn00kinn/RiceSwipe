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
          
          {/* [修正] 画像を純粋に表示するための変更
              Next/Imageのwidth/height強制を避け、標準のimgタグで自然なアスペクト比を表示します。
              max-w-full で親要素からはみ出さないようにし、h-auto で高さを自動調整します。
          */}
          <div className="flex justify-center mb-6">
            <img 
              src="/header.jpg" 
              alt="Header Logo" 
              className="w-auto h-24 max-w-full object-contain"
            />
          </div>

          <h1 className="text-3xl font-bold text-white tracking-tight">
            おかえりなさい
          </h1>
          <p className="text-gray-400 text-sm">
            ログインして動画を楽しみましょう
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
          続行することで、利用規約とプライバシーポリシーに同意したことになります。
        </div>
      </div>
    </div>
  );
}