// lib/schemas.ts
import { z } from "zod";

/**
 * A short representation of a user, typically for embedding in other objects.
 */
export const UserShortSchema = z.object({
  id: z.string().uuid({ message: "Invalid user ID format" }),
  name: z.string().nullable(),
});

/**
 * Represents a single video entity, including its metadata and author.
 */
export const VideoSchema = z.object({
  id: z.string({ message: "Invalid video ID format" }),
  title: z.string(),
  description: z.string().nullable(),
  createdAt: z.string().datetime({ message: "Invalid date format" }),
  author: UserShortSchema,
  videoUrl: z.string().url({ message: "Invalid video URL" }),
});

/**
 * Schema for the response from the `/api/feed` endpoint.
 */
export const FeedResponseSchema = z.object({
  videos: z.array(VideoSchema),
  nextCursor: z.string().nullable(),
});
