import { NextResponse } from "next/server";
import { ApiError } from "./errors";

/** Successful JSON response with the standard envelope. */
export function ok(data, { status = 200, meta, headers } = {}) {
  return NextResponse.json(meta ? { data, meta } : { data }, { status, headers });
}

export function created(data, options = {}) {
  return ok(data, { ...options, status: 201 });
}

/** Error JSON response with the standard envelope. */
export function fail(error) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message, ...(error.details ? { details: error.details } : {}) } },
      { status: error.status },
    );
  }

  // Unknown error: never leak internals to the client.
  console.error("[api] Unhandled error:", error);
  return NextResponse.json(
    { error: { code: "INTERNAL_ERROR", message: "Something went wrong on our side. Please try again." } },
    { status: 500 },
  );
}

/**
 * Wrap a route handler so thrown errors become consistent JSON responses.
 * Usage: `export const GET = withErrorHandling(async (request) => ok(...))`
 */
export function withErrorHandling(handler) {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      return fail(error);
    }
  };
}

/** Safely parse a JSON request body. */
export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    throw ApiError.badRequest("Request body must be valid JSON.");
  }
}
