// /lib/dbClient.ts
import postgres, { Sql } from "postgres";

let sql: Sql | null = null;

const DATABASE_URL = process.env.DATABASE_URL;

if (DATABASE_URL) {
  // Edge Runtime でも動作するクライアントをエクスポート
  sql = postgres(DATABASE_URL, {
    ssl: "require",
    max: 1, // サーバーレス環境では接続ごとに確立・破棄が推奨される
  });
} else {
  if (process.env.NODE_ENV === "development") {
    console.warn(
      "⚠️ DATABASE_URL is not set. DB queries will fail. Check your .env.local file."
    );
  } else {
    // 本番環境では起動を許可しない
    throw new Error("DATABASE_URL is not set.");
  }
}

export { sql };
