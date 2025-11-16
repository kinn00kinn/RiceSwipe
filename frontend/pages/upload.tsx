// pages/upload.tsx
// import AuthGuard from "@/components/AuthGuard";
import Navigation from "@/components/Navigation";
import UploadForm from "@/components/UploadForm";
import dynamic from "next/dynamic"; // 👈 追加

// 👈 ここから追加
const AuthGuard = dynamic(() => import("@/components/AuthGuard"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <p>読み込み中...</p>
    </div>
  ),
});
// 👈 ここまで追加

export default function UploadPage() {
  return (
    <AuthGuard>
      {(user) => (
        <div className="min-h-screen bg-gray-100">
          <header className="bg-white shadow-sm">
            <div className="max-w-md mx-auto p-4">
              <h1 className="text-xl font-bold">動画をアップロード</h1>
            </div>
          </header>
          <main className="max-w-md mx-auto p-4">
            <UploadForm />
          </main>
          <Navigation />
        </div>
      )}
    </AuthGuard>
  );
}
