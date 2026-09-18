import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { requirePageUser } from "@/server/auth/pageGuards";

export const dynamic = "force-dynamic";

/**
 * Authenticated dashboard shell. The session cookie is validated against the
 * database here on every request; unauthenticated visitors are redirected to
 * the login page (the proxy already short-circuits requests with no cookie).
 */
export default async function DashboardAppLayout({ children }) {
  const user = await requirePageUser();
  return <DashboardShell user={user}>{children}</DashboardShell>;
}
