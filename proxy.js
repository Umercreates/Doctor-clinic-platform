import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { dashboardRoutes } from "@/lib/routes";

/**
 * Edge proxy (Next.js 16 name for middleware) for the staff dashboard.
 *
 * - Refreshes the Supabase Auth session cookies on every dashboard request.
 * - Redirects visitors without a valid Supabase user to /dashboard/login.
 * - Sends signed-in users away from the login page.
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

export async function proxy(request) {
  const { pathname } = request.nextUrl;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const isLogin = PUBLIC_DASHBOARD_PATHS.has(pathname);

  // Supabase not configured: nobody can be signed in.
  if (!supabaseUrl || !publishableKey) {
    return isLogin ? NextResponse.next() : redirectToLogin(request);
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl, publishableKey, {
    cookieOptions: { path: "/", sameSite: "lax", secure: process.env.NODE_ENV === "production" },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers = {}) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
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
  matcher: ["/dashboard/:path*"],
};
