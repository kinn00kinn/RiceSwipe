import React from 'react';

const PendingApprovalPage = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg text-center text-white">
        <h1 className="text-3xl font-bold">Account Pending Approval</h1>
        <p className="text-gray-300">
          Your account is currently pending approval. You will receive an email once your account has been activated.
        </p>
        <p className="text-gray-400 text-sm">
          Thank you for your patience.
        </p>
      </div>
    </div>
  );
};

export default PendingApprovalPage;
