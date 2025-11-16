// pages/api/videos.ts
import { createServerClient, serialize } from "@supabase/ssr";
import { NextApiRequest, NextApiResponse } from "next";
import { sql } from "@/lib/dbClient";
export const runtime = 'edge'; // 👈 この行を追記
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Apply the same explicit client creation fix
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { videoId, title, description } = req.body;
  if (!videoId || !title) {
    return res.status(400).json({ error: "videoId and title are required." });
  }

  if (!sql) {
    return res.status(500).json({ error: "Database client not initialized." });
  }

  try {
    const [video] = await sql`
      UPDATE videos
      SET
        title = ${title},
        description = ${description || null}
      WHERE
        id = ${videoId} AND author_id = ${user.id}
      RETURNING *;
    `;

    if (!video) {
      return res.status(404).json({ error: "Video not found or you do not have permission to edit it." });
    }

    return res.status(200).json(video);

  } catch (error) {
    console.error("Error updating video metadata:", error);
    return res.status(500).json({ error: "Failed to update video metadata." });
  }
}
