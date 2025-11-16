// components/Profile.tsx
"use client";

import { useState } from "react";
import { useAuthStore } from "@/stores/authStore";

export default function Profile() {
  const { user } = useAuthStore();
  const [profileData, setProfileData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFetchProfile = async () => {
    setLoading(true);
    setError(null);
    setProfileData(null);

    try {
      const response = await fetch("/api/me");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch profile.");
      }

      setProfileData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null; // Don't show this component if not logged in
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-md space-y-4">
      <h2 className="text-xl font-bold">認証テスト</h2>
      <p className="text-sm">以下のボタンを押すと、保護されたAPI (`/api/me`) にあなたの認証情報を使ってアクセスを試みます。</p>
      <button
        onClick={handleFetchProfile}
        disabled={loading}
        className="w-full bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400"
      >
        {loading ? "取得中..." : "自分のユーザー情報を取得"}
      </button>
      {error && (
        <div>
          <h3 className="font-bold text-red-600">エラー:</h3>
          <pre className="text-sm bg-red-50 p-2 rounded mt-1">{error}</pre>
        </div>
      )}
      {profileData && (
        <div>
          <h3 className="font-bold text-green-600">成功！取得したユーザー情報:</h3>
          <pre className="text-sm bg-gray-50 p-2 rounded mt-1 whitespace-pre-wrap">
            {JSON.stringify(profileData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
