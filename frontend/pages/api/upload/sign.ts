import { createServerClient, serialize } from "@supabase/ssr";
import { NextApiRequest, NextApiResponse } from "next";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import s3 from "@/lib/r2Client"; // R2 client
import { sql } from "@/lib/dbClient"; // DB client

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("\n--- /api/upload/sign: Handler started (v2) ---");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // --- EXPERIMENTAL CHANGE ---
  // Explicitly pass env vars to the client creation function
  console.log("-> Creating Supabase client explicitly...");
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => req.cookies[name],
        set: (name, value, options) => {
          res.appendHeader("Set-Cookie", serialize(name, value, options));
        },
        remove: (name, options) => {
          res.appendHeader("Set-Cookie", serialize(name, "", options));
        },
      },
    }
  );
  console.log("-> Supabase client created.");
  // --- END EXPERIMENTAL CHANGE ---

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.log("-> Auth check failed: No user");
    return res.status(401).json({ error: "Unauthorized" });
  }
  console.log("-> Auth check passed for user:", user.id);

  const { filename, contentType } = req.body;
  if (!filename || !contentType) {
    return res.status(400).json({ error: "filename and contentType are required." });
  }
  console.log("-> Body validation passed:", { filename, contentType });

  if (!s3 || !sql) {
    return res.status(500).json({ error: "Server not configured correctly." });
  }
  console.log("-> Client initialization check passed.");

  try {
    console.log("-> Step 4: Inserting preliminary video record into DB...");
    const [video] = await sql`
      INSERT INTO videos (id, author_id, title, r2_object_key)
      VALUES (DEFAULT, ${user.id}, ${filename}, '')
      RETURNING id;
    `;
    const videoId = video.id;
    console.log("-> DB INSERT success. Video ID:", videoId);

    console.log("-> Step 5: Updating video record with object key...");
    const objectKey = `${user.id}/${videoId}/${filename}`;
    await sql`
      UPDATE videos
      SET r2_object_key = ${objectKey}
      WHERE id = ${videoId};
    `;
    console.log("-> DB UPDATE success. Object Key:", objectKey);

    console.log("-> Step 6: Generating presigned URL for R2...");
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: objectKey,
      ContentType: contentType,
    });
    console.log("-> R2 Command created with Bucket:", process.env.R2_BUCKET_NAME);

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
    console.log("-> Presigned URL generated successfully.");

    console.log("--- Handler finished successfully ---");
    return res.status(200).json({ uploadUrl, videoId, objectKey });

  } catch (error) {
    console.error("--- ERROR in /api/upload/sign ---", error);
    return res.status(500).json({ error: "Failed to sign upload URL." });
  }
}
