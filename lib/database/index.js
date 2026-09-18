/**
 * PostgreSQL access layer (server-side only).
 *
 * - A single connection pool is created lazily from DATABASE_URL and cached on
 *   `globalThis` so it survives hot reloads in development.
 * - All queries are parameterized (`$1, $2, ...`); never interpolate values.
 * - `withTransaction` gives callers a client bound to one transaction.
 * - PostgreSQL errors are translated into safe `ApiError`s by `translateDatabaseError`.
 *
 * When DATABASE_URL is not set the application runs in "demo-data" mode: the
 * public site reads the bundled catalogue and writes go to an in-memory store.
 * Authentication and dashboard APIs require the database.
 */
import { ApiError } from "@/server/http/errors";

if (typeof window !== "undefined") {
  throw new Error("lib/database must never be imported into client-side code.");
}

const GLOBAL_KEY = "__doctorClinicPgPool";

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export function getDatabaseStatus() {
  return {
    driver: "postgresql",
    configured: isDatabaseConfigured(),
    mode: isDatabaseConfigured() ? "postgres" : "demo-data",
  };
}

async function createPool() {
  const { Pool, types } = await import("pg");
  // Return DATE columns as "YYYY-MM-DD" strings instead of JS Dates so calendar
  // dates never shift with the server's time zone.
  types.setTypeParser(1082, (value) => value);
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: Number(process.env.DATABASE_POOL_MAX || 10),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false" } : undefined,
  });
  pool.on("error", (error) => {
    // Idle client errors (e.g. server restart). Never crash the process.
    console.error("[db] Idle client error:", error.message);
  });
  return pool;
}

/** Returns the shared pool, creating it on first use. */
export async function getPool() {
  if (!isDatabaseConfigured()) {
    throw ApiError.serviceUnavailable("The database is not configured on this environment.");
  }
  if (!globalThis[GLOBAL_KEY]) {
    globalThis[GLOBAL_KEY] = createPool();
  }
  return globalThis[GLOBAL_KEY];
}

/**
 * Run a single parameterized query.
 * @param {string} text  SQL with $1..$n placeholders
 * @param {any[]} [params]
 * @param {import('pg').PoolClient} [client]  Optional transaction client
 */
export async function query(text, params = [], client) {
  try {
    if (client) return await client.query(text, params);
    const pool = await getPool();
    return await pool.query(text, params);
  } catch (error) {
    throw translateDatabaseError(error);
  }
}

/** Convenience: first row or null. */
export async function queryOne(text, params = [], client) {
  const result = await query(text, params, client);
  return result.rows[0] || null;
}

/** Convenience: all rows. */
export async function queryRows(text, params = [], client) {
  const result = await query(text, params, client);
  return result.rows;
}

/**
 * Execute `fn(client)` inside a transaction. Rolls back on any error.
 */
export async function withTransaction(fn) {
  const pool = await getPool();
  let client;
  try {
    client = await pool.connect();
  } catch (error) {
    throw translateDatabaseError(error);
  }
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("[db] Rollback failed:", rollbackError.message);
    }
    throw translateDatabaseError(error);
  } finally {
    client.release();
  }
}

/** Lightweight connectivity check used by /api/v1/health. */
export async function pingDatabase() {
  if (!isDatabaseConfigured()) return { ok: false, reason: "not-configured" };
  const started = Date.now();
  try {
    await query("SELECT 1");
    return { ok: true, latencyMs: Date.now() - started };
  } catch (error) {
    return { ok: false, reason: error.code || "error" };
  }
}

/** Close the pool (used by scripts). */
export async function closePool() {
  const pool = globalThis[GLOBAL_KEY];
  if (pool) {
    globalThis[GLOBAL_KEY] = undefined;
    await (await pool).end();
  }
}

// ---------------------------------------------------------------------------
// Error translation
// ---------------------------------------------------------------------------

const CONNECTION_CODES = new Set(["ECONNREFUSED", "ENOTFOUND", "ETIMEDOUT", "ECONNRESET", "57P01", "57P02", "57P03", "08000", "08003", "08006", "28P01", "3D000"]);

/**
 * Map PostgreSQL / driver errors to safe, user-facing ApiErrors. The original
 * error is logged server-side with its code; clients never see SQL or internals.
 */
export function translateDatabaseError(error) {
  if (error instanceof ApiError) return error;

  const code = error?.code;
  const constraint = error?.constraint;

  if (CONNECTION_CODES.has(code) || error?.message?.includes("timeout exceeded when trying to connect")) {
    console.error(`[db] Connection error (${code || "unknown"}): ${error.message}`);
    return ApiError.serviceUnavailable("The database is temporarily unavailable. Please try again shortly.");
  }

  switch (code) {
    case "23505": // unique_violation
      console.warn(`[db] Unique violation on ${constraint || "unknown constraint"}`);
      return ApiError.conflict("A record with the same unique value already exists.", constraint ? { constraint } : undefined);
    case "23P01": // exclusion_violation (overlapping appointment or schedule block)
      console.warn(`[db] Exclusion violation on ${constraint || "unknown constraint"}`);
      if (String(constraint).includes("doctor_schedules")) {
        return ApiError.conflict("This block overlaps an existing schedule block for that day.", { start: "Overlaps an existing block." });
      }
      return ApiError.slotUnavailable();
    case "23503": // foreign_key_violation
      console.warn(`[db] Foreign key violation on ${constraint || "unknown constraint"}`);
      return ApiError.validation({ reference: "One of the referenced records does not exist." }, "A referenced record does not exist.");
    case "23502": // not_null_violation
      console.warn(`[db] Not-null violation on column ${error.column || "unknown"}`);
      return ApiError.validation({ [error.column || "field"]: "This field is required." });
    case "23514": // check_violation
      console.warn(`[db] Check violation on ${constraint || "unknown constraint"}`);
      return ApiError.validation({ value: "One of the values is not allowed." }, "One of the values is not allowed.");
    case "22P02": // invalid_text_representation (e.g. malformed UUID)
      return ApiError.badRequest("One of the identifiers is not valid.");
    case "22007": // invalid_datetime_format
    case "22008":
      return ApiError.badRequest("One of the dates or times is not valid.");
    case "40001": // serialization_failure
    case "40P01": // deadlock_detected
      console.warn(`[db] Transaction conflict (${code})`);
      return ApiError.conflict("The request conflicted with another update. Please try again.");
    case "42P01": // undefined_table -> migrations not run
      console.error("[db] Undefined table. Have migrations been applied? (npm run db:migrate)");
      return ApiError.serviceUnavailable("The database schema is not ready. Please run migrations.");
    default:
      console.error(`[db] Query error${code ? ` (${code})` : ""}: ${error?.message}`);
      return new ApiError(500, "INTERNAL_ERROR", "Something went wrong on our side. Please try again.");
  }
}
