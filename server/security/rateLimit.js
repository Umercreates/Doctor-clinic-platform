/**
 * Fixed-window rate limiting for public and authentication endpoints.
 *
 * Store: the `rate_limits` table in PostgreSQL (migration 0003), so limits are
 * shared by every application instance that uses the same database. Each
 * check is a single atomic UPSERT. When no database is configured (demo mode)
 * an in-memory map is used instead — that fallback is per process and is NOT
 * suitable for a multi-instance production deployment; production requires
 * DATABASE_URL anyway (see server/config/env.js).
 *
 * Failure policy: if the store is unreachable the request is allowed and the
 * error is logged. Booking and sign-in already depend on the same database,
 * so the practical effect of a store outage is limited to lost rate counts,
 * and a database outage never turns into a self-inflicted denial of service.
 */
import { createHash } from "node:crypto";
import { ApiError } from "@/server/http/errors";
import { isDatabaseConfigured, queryOne, query } from "@/lib/database";
import { getClientIp } from "@/server/auth/currentUser";
import { log } from "@/server/log";

/** Named policies: limit per window. Keep these generous for a real clinic. */
export const RATE_LIMITS = {
  /** Sign-in attempts per IP + email (credential stuffing). */
  "login:identity": { limit: 10, windowMs: 15 * 60 * 1000 },
  /** Sign-in attempts per IP across all accounts. */
  "login:ip": { limit: 30, windowMs: 15 * 60 * 1000 },
  /** Public booking submissions per IP. */
  "booking:ip": { limit: 20, windowMs: 60 * 60 * 1000 },
  /** Public booking submissions per patient email. */
  "booking:email": { limit: 6, windowMs: 60 * 60 * 1000 },
  /** Contact form messages per IP. */
  "contact:ip": { limit: 5, windowMs: 60 * 60 * 1000 },
  /** Availability lookups per IP (calendar navigation). */
  "availability:ip": { limit: 120, windowMs: 60 * 1000 },
};

const memory = new Map();
let cleanupCounter = 0;

/** Keys never store raw IPs or emails: the identifier is hashed. */
function keyFor(policyName, identifier) {
  const digest = createHash("sha256").update(String(identifier || "unknown")).digest("hex").slice(0, 32);
  return `${policyName}:${digest}`;
}

function memoryHit(key, windowMs) {
  const now = Date.now();
  if (memory.size > 10_000) {
    for (const [k, v] of memory) if (v.windowStart + windowMs <= now) memory.delete(k);
  }
  const bucket = memory.get(key);
  if (!bucket || bucket.windowStart + windowMs <= now) {
    memory.set(key, { windowStart: now, count: 1 });
    return { count: 1, windowStart: now };
  }
  bucket.count += 1;
  return { count: bucket.count, windowStart: bucket.windowStart };
}

async function databaseHit(key, windowMs) {
  const now = new Date();
  const expiredBefore = new Date(now.getTime() - windowMs);
  const row = await queryOne(
    `INSERT INTO rate_limits (key, window_start, count) VALUES ($1, $2, 1)
     ON CONFLICT (key) DO UPDATE SET
       count = CASE WHEN rate_limits.window_start <= $3 THEN 1 ELSE rate_limits.count + 1 END,
       window_start = CASE WHEN rate_limits.window_start <= $3 THEN $2 ELSE rate_limits.window_start END
     RETURNING count, window_start`,
    [key, now, expiredBefore],
  );
  // Opportunistic cleanup of stale rows (roughly every 200 checks).
  if (++cleanupCounter % 200 === 0) {
    query("DELETE FROM rate_limits WHERE window_start < now() - interval '1 day'").catch(() => {});
  }
  return { count: Number(row.count), windowStart: new Date(row.window_start).getTime() };
}

/**
 * Count a hit and report whether it is within the policy.
 * @returns {{ allowed: boolean, remaining: number, retryAfterSeconds: number }}
 */
export async function checkRateLimit(policyName, identifier) {
  const policy = RATE_LIMITS[policyName];
  if (!policy) throw new Error(`Unknown rate limit policy: ${policyName}`);
  const key = keyFor(policyName, identifier);
  let hit;
  try {
    hit = isDatabaseConfigured() ? await databaseHit(key, policy.windowMs) : memoryHit(key, policy.windowMs);
  } catch (error) {
    log.error("ratelimit.store_error", { policy: policyName, error });
    return { allowed: true, remaining: policy.limit, retryAfterSeconds: 0 };
  }
  const allowed = hit.count <= policy.limit;
  const retryAfterSeconds = Math.max(1, Math.ceil((hit.windowStart + policy.windowMs - Date.now()) / 1000));
  return { allowed, remaining: Math.max(0, policy.limit - hit.count), retryAfterSeconds: allowed ? 0 : retryAfterSeconds };
}

/** Throw 429 (with Retry-After) when the policy is exceeded. */
export async function enforceRateLimit(policyName, identifier, { message } = {}) {
  const result = await checkRateLimit(policyName, identifier);
  if (!result.allowed) {
    log.warn("ratelimit.exceeded", { policy: policyName, retryAfterSeconds: result.retryAfterSeconds });
    const error = ApiError.tooManyRequests(message);
    error.headers = { "Retry-After": String(result.retryAfterSeconds) };
    throw error;
  }
  return result;
}

/** Convenience for route handlers: enforce a per-IP policy for the request. */
export function enforceIpRateLimit(request, policyName, options) {
  return enforceRateLimit(policyName, getClientIp(request) || "unknown", options);
}

/** Reset a key after success (e.g. a correct sign-in clears the identity counter). */
export async function clearRateLimit(policyName, identifier) {
  const key = keyFor(policyName, identifier);
  try {
    if (isDatabaseConfigured()) await query("DELETE FROM rate_limits WHERE key = $1", [key]);
    else memory.delete(key);
  } catch (error) {
    log.error("ratelimit.store_error", { policy: policyName, error });
  }
}
