// src/lib/r2Client.ts
import { S3Client } from "@aws-sdk/client-s3";

// .env.local からサーバーサイドの環境変数を読み込む
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;

// 環境変数が設定されているか厳格にチェック
if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  throw new Error(
    "R2 environment variables (ACCOUNT_ID, ACCESS_KEY_ID, SECRET_ACCESS_KEY) are not correctly set in .env.local"
  );
}

// docs/設計書.md に基づく R2 のエンドポイント URL を構築
const r2Endpoint = `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`.replace(
  "<ACCOUNT_ID>",
  R2_ACCOUNT_ID
);

// S3 互換 API (R2) クライアントのインスタンスを作成
// docs/backend.md の規約 (NFR-P3) に従い、AWS SDK を使用する
export const r2 = new S3Client({
  region: "auto",
  endpoint: r2Endpoint,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});
