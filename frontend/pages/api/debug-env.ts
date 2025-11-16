// pages/api/debug-env.ts
import { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { sql } from "@/lib/dbClient";
import s3 from "@/lib/r2Client";
import { ListBucketsCommand } from "@aws-sdk/client-s3";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // --- 1. Presence Checks ---
  const presenceChecks = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL
      ? "✅ Set"
      : "❌ Not Set",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ? "✅ Set"
      : "❌ Not Set",
    DATABASE_URL: process.env.DATABASE_URL ? "✅ Set" : "❌ Not Set",
    R2_BUCKET_NAME: process.env.R2_BUCKET_NAME ? "✅ Set" : "❌ Not Set",
    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID ? "✅ Set" : "❌ Not Set",
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID ? "✅ Set" : "❌ Not Set",
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY
      ? "✅ Set"
      : "❌ Not Set",
  };

  // --- 2. Connectivity Tests ---
  const connectivityTests = {
    supabase_auth: "Not Tested",
    database_postgres: "Not Tested",
    cloudflare_r2: "Not Tested",
  };

  // Test Supabase Auth Client Initialization
  try {
    if (
      presenceChecks.NEXT_PUBLIC_SUPABASE_URL.includes("✅") &&
      presenceChecks.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes("✅")
    ) {
      createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      connectivityTests.supabase_auth = "✅ Client initialized successfully";
    } else {
      throw new Error("URL or Key not set");
    }
  } catch (e: any) {
    connectivityTests.supabase_auth = `❌ Failure: ${e.message}`;
  }

  // Test Postgres Connection
  try {
    if (!sql) throw new Error("DB client not initialized (check DATABASE_URL)");
    await sql`SELECT 1`;
    connectivityTests.database_postgres = "✅ Connection successful";
  } catch (e: any) {
    connectivityTests.database_postgres = `❌ Failure: ${e.code || e.message}`;
  }

  // Test R2 Credentials by listing buckets
  try {
    if (!s3) throw new Error("R2 client not initialized (check R2 env vars)");
    await s3.send(new ListBucketsCommand({}));
    connectivityTests.cloudflare_r2 =
      "✅ Connection successful (credentials are valid)";
  } catch (e: any) {
    connectivityTests.cloudflare_r2 = `❌ Failure: ${e.name} - ${e.message}`;
  }

  res.setHeader("Content-Type", "application/json");
  res.status(200).send(
    JSON.stringify(
      {
        presence_checks: presenceChecks,
        connectivity_tests: connectivityTests,
      },
      null,
      2
    )
  );
}