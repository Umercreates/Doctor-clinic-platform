import { DashboardShell } from "@/components/dashboard/DashboardShell";

/**
 * Authenticated dashboard shell (sidebar + header). Authentication and
 * role-based access are enforced in the backend phase via `proxy.js`.
 */
export default function DashboardAppLayout({ children }) {
  return <DashboardShell>{children}</DashboardShell>;
}
