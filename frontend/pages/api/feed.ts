// pages/api/feed.ts
import { sql } from "@/lib/dbClient";
import { NextApiRequest, NextApiResponse } from "next";
export const runtime = 'edge'; // 👈 この行を追記
const FEED_LIMIT = 5;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  if (!sql) {
    return res.status(500).json({ error: "Database client not initialized." });
  }

  const r2PublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
  if (!r2PublicUrl) {
    console.error("R2_PUBLIC_URL is not set.");
    // This is a server-side configuration issue, so we return a generic error to the client.
    return res.status(500).json({ error: "Internal Server Error" });
  }

  const cursor = req.query.cursor as string | undefined;
  const limit = FEED_LIMIT;

  try {
    // We fetch one more item than the limit to determine if a next page exists.
    const queryLimit = limit + 1;

    // CUIDs are lexicographically sortable, so we can use them for cursor-based pagination.
    const result = await (cursor
      ? sql`
          SELECT
            v.id,
            v.title,
            v.description,
            v.r2_object_key,
            v.created_at as "createdAt",
            json_build_object('id', u.id, 'name', u.name) as author
          FROM videos v
          JOIN users u ON v.author_id = u.id
          WHERE v.id < ${cursor}
          ORDER BY v.id DESC
          LIMIT ${queryLimit};
        `
      : sql`
          SELECT
            v.id,
            v.title,
            v.description,
            v.r2_object_key,
            v.created_at as "createdAt",
            json_build_object('id', u.id, 'name', u.name) as author
          FROM videos v
          JOIN users u ON v.author_id = u.id
          ORDER BY v.id DESC
          LIMIT ${queryLimit};
        `);
    
    // Convert the `Result` object from postgres.js to a plain JavaScript array to ensure compatibility.
    const videos = Array.from(result);

    let nextCursor: string | null = null;
    if (videos.length > limit) {
      // The last item is only for determining the next cursor, so we remove it.
      const nextItem = videos.pop();
      if (nextItem) {
        nextCursor = nextItem.id;
      }
    }

    // Map to the final structure, creating the full video URL.
    const responseVideos = videos.map((video) => ({
      id: video.id,
      title: video.title,
      description: video.description,
      createdAt: video.createdAt,
      author: video.author,
      videoUrl: `${r2PublicUrl}/${video.r2_object_key}`, // Add the full URL
    }));

    return res.status(200).json({ videos: responseVideos, nextCursor });
  } catch (error) {
    console.error("Error fetching feed:", error);
    return res.status(500).json({ error: "Failed to fetch video feed." });
  }
}
