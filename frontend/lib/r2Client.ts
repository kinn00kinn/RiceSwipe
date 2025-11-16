// /lib/r2Client.ts
import { S3Client } from "@aws-sdk/client-s3";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;

let s3: S3Client | null = null;

if (R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY) {
  s3 = new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
} else {
  if (process.env.NODE_ENV === "development") {
    console.warn(
      "⚠️ R2 environment variables are not set. File uploads will fail. Check your .env.local file."
    );
  } else {
    // 本番環境では起動を許可しない
    throw new Error("R2 environment variables are not set.");
  }
}

export default s3;
