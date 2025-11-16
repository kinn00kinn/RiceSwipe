// pages/debug.tsx
import Debug from "@/components/Debug";
import Head from "next/head";

const DebugPage = () => {
  return (
    <>
      <Head>
        <title>Debug Page</title>
      </Head>
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="w-full max-w-2xl p-4">
          <Debug />
        </div>
      </div>
    </>
  );
};

export default DebugPage;
