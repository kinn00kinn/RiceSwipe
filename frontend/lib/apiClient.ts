// lib/apiClient.ts
import { z } from "zod";

/**
 * Custom error class for API-related errors.
 * Contains the HTTP status and the response data for better error handling.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly data: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * A generic fetcher function that validates the response against a Zod schema.
 *
 * @param url The URL to fetch.
 * @param schema The Zod schema to validate the response against.
 * @param options Optional request init options.
 * @returns The validated data.
 * @throws {ApiError} if the network request fails.
 * @throws {Error} if the response data fails validation.
 */
async function fetcher<T extends z.ZodTypeAny>(
  url: string,
  schema: T,
  options?: RequestInit
): Promise<z.infer<T>> {
  const response = await fetch(url, options);

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }
    throw new ApiError(
      `API request failed with status ${response.status}`,
      response.status,
      errorData
    );
  }

  const data = await response.json();
  const parsed = schema.safeParse(data);

  if (!parsed.success) {
    // Log the detailed validation error for debugging purposes on the server/client.
    console.error("API response validation failed:", parsed.error.flatten());
    // Throw a generic error to the user-facing parts of the app.
    throw new Error("Received invalid data structure from the server.");
  }

  return parsed.data;
}

/**
 * A simple API client to interact with the Next.js API routes.
 */
export const apiClient = {
  /**
   * Makes a GET request to the specified path and validates the response.
   * @param path The path relative to `/api`.
   * @param schema The Zod schema for the response.
   * @param options Optional request init options.
   */
  get: <T extends z.ZodTypeAny>(
    path: string,
    schema: T,
    options?: RequestInit
  ) => {
    // All our API routes are under `/api`, so we prepend it.
    return fetcher(`/api${path}`, schema, { ...options, method: "GET" });
  },

  // POST, PUT, DELETE methods can be added here as needed.
  // Example:
  // post: <T extends z.ZodTypeAny>(path: string, body: unknown, schema: T, options?: RequestInit) => {
  //   return fetcher(`/api${path}`, schema, {
  //     ...options,
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json', ...options?.headers },
  //     body: JSON.stringify(body),
  //   });
  // },
};
