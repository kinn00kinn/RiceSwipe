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
          <h1 className="text-3xl font-bold">Account Pending Approval</h1>
          <p className="mt-2 text-gray-300">
            {" "}
            {/* [変更点] mt-2追加 */}
            Your account is currently pending approval. You will receive an
            email once your account has been activated.
          </p>
          <p className="mt-2 text-gray-400 text-sm">
            {" "}
            {/* [変更点] mt-2追加 */}
            Thank you for your patience.
          </p>
        </div>
        {/* [変更点] サインアウトして別のアカウントで試すためのフォームを追加 */}
        <form action="/auth/signout" method="post">
          <Button
            variant="outline"
            size="default"
            className="w-full text-white"
          >
            Sign in with a different account
          </Button>
        </form>
      </div>
    </div>
  );
};

export default PendingApprovalPage;
