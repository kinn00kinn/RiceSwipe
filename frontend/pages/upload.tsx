// pages/upload.tsx
import AuthGuard from "@/components/AuthGuard";
import Navigation from "@/components/Navigation";
import UploadForm from "@/components/UploadForm";

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
