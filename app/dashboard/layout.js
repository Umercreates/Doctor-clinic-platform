import { clinic } from "@/data/clinic";

/**
 * Dashboard root. Keeps the staff area out of search engines and free of the
 * public site chrome. Route groups below provide the sign-in and app shells.
 */
export const metadata = {
  title: { default: `Dashboard | ${clinic.name}`, template: `%s | ${clinic.name} Dashboard` },
  robots: { index: false, follow: false },
};

export default function DashboardRootLayout({ children }) {
  return children;
}
