import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PageTitle } from "@/components/dashboard/PageTitle";
import { Card } from "@/components/ui/Card";
import { settingsGroups } from "@/data/dashboard";
import { dashboardRoutes } from "@/lib/routes";
import { requirePagePermission } from "@/server/auth/pageGuards";

export const metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function DashboardSettingsPage() {
  await requirePagePermission("settings:write", dashboardRoutes.settings);
  return (
    <>
      <PageTitle title="Settings" description="Clinic profile, contact details, booking rules, notifications, and staff access." />
      <ul className="grid gap-4 md:grid-cols-2">
        {settingsGroups.map((group) => (
          <li key={group.id}>
            <Card interactive className="h-full">
              <Link href={`${dashboardRoutes.settings}#${group.id}`} className="flex h-full items-center justify-between gap-4 p-5">
                <div>
                  <h2 className="font-semibold text-slate-900">{group.label}</h2>
                  <p className="mt-1 text-sm text-slate-600">{group.description}</p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
              </Link>
            </Card>
          </li>
        ))}
      </ul>
    </>
  );
}
