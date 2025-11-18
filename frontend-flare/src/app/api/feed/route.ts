// src/app/api/feed/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";

export const runtime = "edge";

export async function GET() {
  try {
    const { data: videos, error } = await supabase
      .from("videos")
      .select(
        `
        *,
        author:users!author_id ( id, name )
      `
      ) // 修正箇所: "author" ではなく、
      // "author:users!author_id" と明示的に指定
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      throw error;
    }

    return NextResponse.json(videos);
  } catch (error) {
    console.error("Error fetching feed:", error);

    const errorMessage =
      error && typeof error === "object" && "message" in error
        ? error.message
        : "Unknown error";

    return NextResponse.json(
      { error: "Internal Server Error", details: errorMessage },
      { status: 500 }
    );
  }
}
