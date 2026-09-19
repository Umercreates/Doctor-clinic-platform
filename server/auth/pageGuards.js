/**
 * Guards for server components (dashboard pages and layouts).
 */
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { dashboardRoutes } from "@/lib/routes";
import { getCurrentUser } from "./currentUser";
import { can, resolveScope } from "./permissions";

/**
 * Route → permission map for the dashboard, applied in the (app) layout before
 * the page streams so unauthorised visits get a real HTTP redirect. Pages still
 * run their own guards (defence in depth). `scoped` permissions accept ":own".
 */
const DASHBOARD_ROUTE_RULES = [
  { test: (p) => p === dashboardRoutes.root, permission: "appointments:read", scoped: true },
  { test: (p) => p.startsWith(dashboardRoutes.appointments), permission: "appointments:read", scoped: true },
  { test: (p) => p.startsWith(dashboardRoutes.patients), permission: "patients:read", scoped: true },
  { test: (p) => p.startsWith(dashboardRoutes.schedule), permission: "availability:read", scoped: true },
  { test: (p) => p === dashboardRoutes.doctors, permission: "doctors:read" },
  { test: (p) => p.startsWith(`${dashboardRoutes.doctors}/`), permission: "doctors:write" },
  { test: (p) => p === dashboardRoutes.services, permission: "services:read" },
  { test: (p) => p.startsWith(`${dashboardRoutes.services}/`), permission: "services:write" },
  { test: (p) => p.startsWith(dashboardRoutes.content), permission: "content:write" },
  { test: (p) => p.startsWith(dashboardRoutes.settings), permission: "settings:write" },
];

/** Layout guard: redirect when the user's role cannot open the requested dashboard path. */
export async function enforceDashboardRoute(user) {
  const path = (await headers()).get("x-dashboard-path");
  if (!path) return;
  const rule = DASHBOARD_ROUTE_RULES.find((r) => r.test(path));
  if (!rule) return;
  const allowed = rule.scoped ? Boolean(resolveScope(user, rule.permission)) : can(user, rule.permission);
  if (!allowed) redirect(`${dashboardRoutes.root}?denied=1`);
}

/** Only allow same-site dashboard paths as post-login destinations. */
export function safeNextPath(value) {
  if (typeof value !== "string") return dashboardRoutes.root;
  if (!value.startsWith("/dashboard") || value.startsWith("//") || value.includes("\\")) return dashboardRoutes.root;
  if (value === dashboardRoutes.login) return dashboardRoutes.root;
  return value;
}

/** Signed-in user or redirect to the login page. */
export async function requirePageUser(currentPath) {
  const user = await getCurrentUser();
  if (!user) {
    const next = currentPath ? `?next=${encodeURIComponent(currentPath)}` : "";
    redirect(`${dashboardRoutes.login}${next}`);
  }
  return user;
}

/** Signed-in user holding a permission, or redirect to the overview with a notice. */
export async function requirePagePermission(permission, currentPath) {
  const user = await requirePageUser(currentPath);
  if (!can(user, permission)) redirect(`${dashboardRoutes.root}?denied=1`);
  return user;
}

/** Signed-in user plus scope ({ all } or { doctorId }) for a ":own"-capable permission. */
export async function requirePageScope(permission, currentPath) {
  const user = await requirePageUser(currentPath);
  const scope = resolveScope(user, permission);
  if (!scope) redirect(`${dashboardRoutes.root}?denied=1`);
  return { user, scope };
}
