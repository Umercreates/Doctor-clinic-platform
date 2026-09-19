import { ShieldCheck } from "lucide-react";
import { PageTitle } from "@/components/dashboard/PageTitle";
import { SettingsManager } from "@/components/dashboard/settings/SettingsManager";
import { Alert } from "@/components/ui/Alert";
import { dashboardRoutes } from "@/lib/routes";
import { requirePagePermission } from "@/server/auth/pageGuards";
import { listSettingsForAdmin } from "@/server/services/contentService";
import { listDoctors } from "@/server/repositories/doctorsRepository";

export const metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

/**
 * Website settings. Only public-facing clinic information is editable here.
 * Environment secrets (database, Supabase, seed passwords) never reach this
 * page or its API.
 */
export default async function DashboardSettingsPage({ searchParams }) {
  await requirePagePermission("settings:write", dashboardRoutes.settings);
  const [{ tab }, settings, doctors] = await Promise.all([searchParams, listSettingsForAdmin(), listDoctors()]);

  return (
    <>
      <PageTitle
        title="Settings"
        description="Clinic profile, contact details, opening hours, notices and booking rules. Saved changes update the public website immediately."
        demo={false}
      />
      <Alert tone="info" className="mb-6" title="What lives here">
        <span className="inline-flex items-start gap-2">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            Public website information only. Staff accounts are managed in Supabase Auth, and environment secrets are never shown or editable in the dashboard.
          </span>
        </span>
      </Alert>
      <SettingsManager settings={settings} doctors={doctors.map((d) => ({ id: d.id, slug: d.slug, name: d.name }))} initialTab={typeof tab === "string" ? tab : undefined} />
    </>
  );
}
