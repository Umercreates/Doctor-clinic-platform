import { NextResponse } from "next/server";
import { dashboardRoutes } from "@/lib/routes";

/**
 * Edge proxy (Next.js 16 name for middleware).
 *
 * Protects /dashboard/* once authentication is configured. The backend phase
 * sets SESSION_SECRET and issues the session cookie; until then the dashboard
 * foundation stays reachable for layout review and only contains placeholder
 * data. The cookie name is shared with the auth implementation.
 */
export const SESSION_COOKIE = "doctor_session";

const PUBLIC_DASHBOARD_PATHS = new Set([dashboardRoutes.login]);

export function proxy(request) {
  const { pathname } = request.nextUrl;
  const authEnabled = Boolean(process.env.SESSION_SECRET);

  if (!authEnabled || PUBLIC_DASHBOARD_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
  if (hasSession) {
    return NextResponse.next();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = dashboardRoutes.login;
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
