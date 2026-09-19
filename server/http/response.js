import { NextResponse } from "next/server";
import { ApiError } from "./errors";
import { log } from "@/server/log";

/**
 * Standard JSON envelope:
 *   success -> { success: true, data, meta? }
 *   failure -> { success: false, error: { code, message, details? } }
 */
export function ok(data, { status = 200, meta, headers } = {}) {
  return NextResponse.json({ success: true, data, ...(meta ? { meta } : {}) }, { status, headers });
}

export function created(data, options = {}) {
  return ok(data, { ...options, status: 201 });
}

export function noContent(headers) {
  return new NextResponse(null, { status: 204, headers });
}

/**
 * Error JSON response with the standard envelope. `ApiError`s carry a safe,
 * user-facing message (and optional `headers`, e.g. Retry-After); anything
 * else is logged server-side and answered with a generic 500.
 */
export function fail(error) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        success: false,
        error: { code: error.code, message: error.message, ...(error.details ? { details: error.details } : {}) },
      },
      { status: error.status, headers: error.headers },
    );
  }

  // Unknown error: log server-side (stack only outside production), never leak internals to the client.
  log.error("api.unhandled_error", { error, ...(process.env.NODE_ENV !== "production" ? { stack: error?.stack } : {}) });
  return NextResponse.json(
    { success: false, error: { code: "INTERNAL_ERROR", message: "Something went wrong on our side. Please try again." } },
    { status: 500 },
  );
}

/**
 * Wrap a route handler so thrown errors become consistent JSON responses.
 * Usage: `export const GET = withErrorHandling(async (request, context) => ok(...))`
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

/** Safely parse a JSON request body (objects only). */
export async function readJson(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    throw ApiError.badRequest("Request body must be valid JSON.");
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw ApiError.badRequest("Request body must be a JSON object.");
  }
  return body;
}

/** Parse pagination query params with safe bounds. */
export function readPagination(searchParams, { defaultLimit = 25, maxLimit = 100 } = {}) {
  const limit = Math.min(maxLimit, Math.max(1, Number.parseInt(searchParams.get("limit") || defaultLimit, 10) || defaultLimit));
  const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1);
  return { limit, page, offset: (page - 1) * limit };
}
