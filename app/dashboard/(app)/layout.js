import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { enforceDashboardRoute, requirePageUser } from "@/server/auth/pageGuards";

export const dynamic = "force-dynamic";

/**
 * Authenticated dashboard shell. The session is validated here on every
 * request; unauthenticated visitors are redirected to the login page (the proxy
 * already short-circuits requests with no cookie) and roles are checked against
 * the route map before the page streams, so denials are real HTTP redirects
 * even though pages render behind loading.js.
 */
export default async function DashboardAppLayout({ children }) {
  const user = await requirePageUser();
  await enforceDashboardRoute(user);
  return <DashboardShell user={user}>{children}</DashboardShell>;
}
