"use client"; // [変更点] クライアントコンポーネントに変更

import React from "react";
import { Button } from "../components/ui/Button"; // [変更点] Buttonコンポーネントをインポート

const PendingApprovalPage = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 p-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-lg shadow-lg text-center text-white">
        {" "}
        {/* [変更点] space-yを調整 */}
        <div>
          <h1 className="text-3xl font-bold">アカウント承認待ち</h1>
          <p className="mt-2 text-gray-300">
            {" "}
            {/* [変更点] mt-2追加 */}
            現在、アカウントの承認待ちです。アカウントが有効化され次第、メールでお知らせいたします。
          </p>
          <p className="mt-2 text-gray-400 text-sm">
            {" "}
            {/* [変更点] mt-2追加 */}
            恐れ入りますが、しばらくお待ちください。
          </p>
        </div>
        {/* [変更点] サインアウトして別のアカウントで試すためのフォームを追加 */}
        <form action="/auth/signout" method="post">
          <Button
            variant="outline"
            size="default"
            className="w-full text-white hover:bg-gray-700 border-gray-600"
          >
            別のアカウントでログイン
          </Button>
        </form>
      </div>
    </div>
  );
};

export default PendingApprovalPage;