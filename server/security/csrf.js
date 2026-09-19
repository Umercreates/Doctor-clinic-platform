/**
 * CSRF protection for cookie-authenticated state-changing requests.
 *
 * The dashboard and the public booking/contact forms call `/api/v1/*` with
 * same-origin `fetch`. Supabase Auth cookies are `SameSite=Lax`, which already
 * stops cross-site POST/PUT/PATCH/DELETE from carrying the session in modern
 * browsers; this module adds an explicit origin check so a misconfigured
 * browser or a `SameSite=None` future change can never turn a cross-site
 * request into an authenticated mutation.
 *
 * Rules for POST / PUT / PATCH / DELETE under /api:
 *   1. `Sec-Fetch-Site: cross-site` → reject.
 *   2. `Origin` present → must equal the site origin (NEXT_PUBLIC_SITE_URL) or
 *      the origin of the request's own Host. Anything else (including the
 *      literal "null") → reject.
 *   3. No `Origin` but a `Referer` → its origin must match the same set.
 *   4. Neither header → allowed. Browsers always attach Origin to cross-site
 *      form posts and fetches, so a header-less request comes from a
 *      non-browser client (curl, monitoring) that cannot use ambient cookies.
 * GET/HEAD/OPTIONS are never checked. Runs in the proxy so every handler is
 * covered before any code executes; runtime-agnostic (no Node APIs).
 */

export const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function originOf(value) {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

/** Origins that may issue mutations: the configured site URL and the request's own host. */
export function trustedOrigins(request) {
  const origins = new Set();
  const configured = originOf(process.env.NEXT_PUBLIC_SITE_URL);
  if (configured) origins.add(configured);
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (host) {
    const proto = request.headers.get("x-forwarded-proto") || (request.nextUrl?.protocol || "http:").replace(":", "");
    origins.add(`${proto}://${host}`);
    // Local development is served over http regardless of the configured site URL.
    if (/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)) origins.add(`http://${host}`);
  }
  return origins;
}

/**
 * @returns {{ ok: boolean, reason?: string }}
 */
export function checkCsrf(request) {
  if (!MUTATING_METHODS.has(request.method)) return { ok: true };

  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") return { ok: false, reason: "cross-site" };

  const allowed = trustedOrigins(request);
  const origin = request.headers.get("origin");
  if (origin) {
    return allowed.has(origin) ? { ok: true } : { ok: false, reason: "origin" };
  }
  const referer = originOf(request.headers.get("referer"));
  if (referer) {
    return allowed.has(referer) ? { ok: true } : { ok: false, reason: "referer" };
  }
  return { ok: true };
}
