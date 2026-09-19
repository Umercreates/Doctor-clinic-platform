import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { dashboardRoutes } from "@/lib/routes";
import { checkCsrf } from "@/server/security/csrf";
import { buildContentSecurityPolicy } from "@/server/security/headers";

/**
 * Edge proxy (Next.js 16 name for middleware).
 *
 * /api/*:
 *   - CSRF: state-changing requests must come from this site's origin
 *     (see server/security/csrf.js). Rejections are a clean JSON 403.
 * /dashboard/*:
 *   - Refreshes the Supabase Auth session cookies on every request.
 *   - Redirects visitors without a valid Supabase user to /dashboard/login and
 *     signed-in users away from the login page.
 *   - Generates a per-request nonce and a strict Content-Security-Policy that
 *     Next.js applies to its scripts (dashboard pages are always dynamic).
 *   - Forwards the requested path as `x-dashboard-path` so the dashboard
 *     layout can apply the route permission map before the page streams.
 *
 * Application roles are NOT decided here: pages and API routes resolve the
 * `users` row and enforce permissions server-side.
 */
const PUBLIC_DASHBOARD_PATHS = new Set([dashboardRoutes.login]);

function redirectToLogin(request) {
  const url = request.nextUrl.clone();
  url.pathname = dashboardRoutes.login;
  url.search = "";
  url.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

function csrfRejected() {
  return NextResponse.json(
    { success: false, error: { code: "FORBIDDEN", message: "This request was not accepted. Please reload the page and try again." } },
    { status: 403 },
  );
}

function makeNonce() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    const csrf = checkCsrf(request);
    if (!csrf.ok) return csrfRejected();
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const isLogin = PUBLIC_DASHBOARD_PATHS.has(pathname);
  const nonce = makeNonce();
  const csp = buildContentSecurityPolicy({ scope: "dashboard", nonce });

  const forward = () => {
    const headers = new Headers(request.headers);
    headers.set("x-dashboard-path", pathname);
    headers.set("x-nonce", nonce);
    headers.set("content-security-policy", csp);
    const res = NextResponse.next({ request: { headers } });
    res.headers.set("Content-Security-Policy", csp);
    return res;
  };

  // Supabase not configured: nobody can be signed in.
  if (!supabaseUrl || !publishableKey) {
    return isLogin ? forward() : redirectToLogin(request);
  }

  let response = forward();
  const supabase = createServerClient(supabaseUrl, publishableKey, {
    cookieOptions: { path: "/", sameSite: "lax", secure: process.env.NODE_ENV === "production" },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers = {}) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = forward();
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // getUser() validates the session with Supabase (never trusts the cookie alone).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isLogin) return redirectToLogin(request);
  if (user && isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = dashboardRoutes.root;
    url.search = "";
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};
