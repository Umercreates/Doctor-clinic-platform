/**
 * Guards for server components (dashboard pages and layouts).
 */
import { redirect } from "next/navigation";
import { dashboardRoutes } from "@/lib/routes";
import { getCurrentUser } from "./currentUser";
import { can, resolveScope } from "./permissions";

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
