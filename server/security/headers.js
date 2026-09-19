/**
 * Security headers shared by next.config.mjs (public pages, API) and proxy.js
 * (dashboard, nonce-based CSP). Plain JavaScript with no aliases so the Next
 * config can import it.
 *
 * Content-Security-Policy strategy
 * --------------------------------
 * Dashboard (/dashboard/*): every page is rendered per request, so the proxy
 *   generates a nonce and Next.js applies it to its own scripts. Result:
 *   `script-src 'self' 'nonce-…' 'strict-dynamic'` — no unsafe-inline.
 * Public site: pages are statically rendered and revalidated on demand, which
 *   is incompatible with per-request nonces. Next.js hydrates through inline
 *   scripts, so `script-src 'self' 'unsafe-inline'` is required there. External
 *   script origins are still blocked.
 * Documented exceptions:
 *   - style-src 'unsafe-inline': Tailwind v4 injects a stylesheet; React
 *     `style={{…}}` attributes (image focal points, animation delays) need it.
 *   - frame-src https://www.google.com: the contact page map embed.
 *   - 'unsafe-eval' in development only (React dev tooling); never in production.
 *   - connect-src ws:/wss: in development only (Next.js HMR).
 * The browser never talks to Supabase directly (all auth goes through
 * /api/v1/auth/*), so connect-src stays 'self'.
 */

const isDev = process.env.NODE_ENV === "development";
const isProd = process.env.NODE_ENV === "production";

const MAP_EMBED_ORIGIN = "https://www.google.com";

function serialize(directives) {
  return Object.entries(directives)
    .map(([name, values]) => (values.length ? `${name} ${values.join(" ")}` : name))
    .join("; ");
}

/**
 * @param {object} options
 * @param {"public"|"dashboard"} options.scope
 * @param {string} [options.nonce]  required for the dashboard scope
 */
export function buildContentSecurityPolicy({ scope, nonce } = { scope: "public" }) {
  const script = scope === "dashboard" && nonce ? ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'"] : ["'self'", "'unsafe-inline'"];
  if (isDev) script.push("'unsafe-eval'");
  const connect = ["'self'"];
  if (isDev) connect.push("ws:", "wss:");
  const directives = {
    "default-src": ["'self'"],
    "script-src": script,
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "blob:", "data:"],
    "font-src": ["'self'", "data:"],
    "connect-src": connect,
    "frame-src": scope === "dashboard" ? ["'none'"] : [MAP_EMBED_ORIGIN],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  };
  if (isProd) directives["upgrade-insecure-requests"] = [];
  return serialize(directives);
}

/** Headers applied to every response. HSTS only in production (HTTPS is required there). */
export function commonSecurityHeaders() {
  const headers = [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()" },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    { key: "X-DNS-Prefetch-Control", value: "off" },
  ];
  if (isProd) headers.push({ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" });
  return headers;
}

/** Private, non-indexable areas (dashboard pages and API responses). */
export function privateAreaHeaders() {
  return [
    { key: "Cache-Control", value: "no-store" },
    { key: "X-Robots-Tag", value: "noindex, nofollow" },
  ];
}
