import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";

export const runtime = "edge";

export async function GET() {
  try {
    // prisma/schema.prisma に合わせて、DBの_snake_caseをcamelCaseにエイリアスする
    const { data: videos, error } = await supabase
      .from("videos")
      .select(
        `
        id,
        title,
        description,
        r2ObjectKey:r2_object_key,
        r2CompressedPaths:r2_compressed_paths,
        originalUrl:original_url,
        authorId:author_id,
        createdAt:created_at,
        author:users!author_id ( id, name )
      `
      )
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      throw error;
    }

    return NextResponse.json(videos);
  } catch (error) {
    console.error("Error fetching feed:", error);

    const errorMessage =
      error && typeof error === 'object' && 'message' in error
        ? error.message
        : "Unknown error";
        
    return NextResponse.json(
      { error: "Internal Server Error", details: errorMessage },
      { status: 500 }
    );
  }
}