// components/Debug.tsx
"use client";

import { useState } from "react";

export default function Debug() {
  const [debugData, setDebugData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRunTests = async () => {
    setLoading(true);
    setError(null);
    setDebugData(null);

    try {
      const response = await fetch("/api/debug-env");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch debug info.");
      }

      setDebugData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md space-y-4">
      <h2 className="text-xl font-bold">環境・接続テスト</h2>
      <p className="text-sm">以下のボタンを押すと、すべての環境変数の設定と、外部サービス（DB、R2）への接続性をテストします。</p>
      <button
        onClick={handleRunTests}
        disabled={loading}
        className="w-full bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400"
      >
        {loading ? "テスト実行中..." : "環境と接続をテスト"}
      </button>
      {error && (
        <div>
          <h3 className="font-bold text-red-600">エラー:</h3>
          <pre className="text-sm bg-red-50 p-2 rounded mt-1">{error}</pre>
        </div>
      )}
      {debugData && (
        <div>
          <h3 className="font-bold text-blue-600">テスト結果:</h3>
          <pre className="text-sm bg-gray-50 p-2 rounded mt-1 whitespace-pre-wrap">
            {JSON.stringify(debugData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
