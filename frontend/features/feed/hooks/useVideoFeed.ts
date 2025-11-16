// features/feed/hooks/useVideoFeed.ts
import useSWRInfinite from "swr/infinite";
import { apiClient } from "@/lib/apiClient";
import { FeedResponseSchema } from "@/lib/schemas";
import { useMemo } from "react";

// The fetcher uses our typed apiClient to get and validate the data.
const fetcher = (path: string) => apiClient.get(path, FeedResponseSchema);

/**
 * A custom hook to fetch the video feed with infinite scrolling.
 *
 * @returns An object containing the feed data, loading states, and a function to load more.
 */
export function useVideoFeed() {
  const { data, error, size, setSize, isLoading, isValidating } = useSWRInfinite(
    // getKey generates the API path for each page.
    (pageIndex, previousPageData) => {
      // If the previous page had no next cursor, we've reached the end.
      if (previousPageData && !previousPageData.nextCursor) {
        return null;
      }

      // For the first page, we don't have a cursor.
      if (pageIndex === 0) {
        return "/feed";
      }

      // For subsequent pages, use the cursor from the previous page.
      if (previousPageData?.nextCursor) {
        return `/feed?cursor=${previousPageData.nextCursor}`;
      }
      
      return null;
    },
    fetcher,
    {
      // Revalidation settings can be configured here if needed.
      // For example, revalidateOnFocus: false
    }
  );

  // Flatten the array of pages into a single array of videos.
  const videos = useMemo(() => (data ? data.flatMap((page) => page.videos) : []), [data]);

  // Determine if we are currently loading more pages.
  const isLoadingMore =
    isLoading || (size > 0 && data && typeof data[size - 1] === "undefined");

  // Determine if we have reached the end of the feed.
  const isReachingEnd = data ? data[data.length - 1]?.nextCursor === null : false;

  return {
    videos,
    error,
    isLoading: isLoading,
    isLoadingMore,
    isReachingEnd,
    isValidating,
    size,
    setSize,
  };
}
