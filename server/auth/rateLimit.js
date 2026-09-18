/**
 * Minimal in-memory rate limiter for login attempts (per process).
 * Slows credential-stuffing without a dependency; a shared store (Redis)
 * can replace it in the hardening phase for multi-instance deployments.
 */
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;
const buckets = new Map();

function prune() {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function checkLoginRateLimit(key) {
  if (buckets.size > 5000) prune();
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 };
  }
  bucket.count += 1;
  return { allowed: bucket.count <= MAX_ATTEMPTS, remaining: Math.max(0, MAX_ATTEMPTS - bucket.count), retryAfterMs: bucket.resetAt - now };
}

export function clearLoginRateLimit(key) {
  buckets.delete(key);
}
