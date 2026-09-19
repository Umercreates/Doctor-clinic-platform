import { Pencil, Plus } from "lucide-react";
import { PageTitle } from "@/components/dashboard/PageTitle";
import { DataTable } from "@/components/dashboard/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { listServices } from "@/server/repositories/servicesRepository";
import { requirePagePermission } from "@/server/auth/pageGuards";
import { can } from "@/server/auth/permissions";
import { dashboardRoutes, routes } from "@/lib/routes";

export const metadata = { title: "Services" };
export const dynamic = "force-dynamic";

function formatPrice(cents) {
  if (cents == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export default async function DashboardServicesPage() {
  const user = await requirePagePermission("services:read", dashboardRoutes.services);
  const canEdit = can(user, "services:write");
  const services = await listServices({ includeInactive: canEdit });

  const columns = [
    {
      key: "name",
      label: "Service",
      render: (row) => (
        <span className="inline-flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100">
            <Icon name={row.icon} className="h-4 w-4" />
          </span>
          <span>
            <span className="block font-medium text-slate-900">{row.name}</span>
            <span className="block text-xs text-slate-500">/services/{row.slug}</span>
          </span>
        </span>
      ),
    },
    { key: "durationMinutes", label: "Duration", render: (row) => `${row.durationMinutes} min` },
    { key: "priceCents", label: "Price", render: (row) => <span className="tabular-nums">{formatPrice(row.priceCents)}</span> },
    { key: "doctorIds", label: "Doctors", render: (row) => (row.doctorIds.length ? row.doctorIds.length : <span className="text-amber-700">None</span>) },
    { key: "isActive", label: "Status", render: (row) => <Badge variant={row.isActive ? "success" : "neutral"} dot>{row.isActive ? "Published" : "Deactivated"}</Badge> },
    {
      key: "actions",
      label: "",
      className: "text-right",
      render: (row) =>
        canEdit ? (
          <Button variant="ghost" size="sm" leftIcon={Pencil} href={`${dashboardRoutes.services}/${row.id}`}>
            Edit
          </Button>
        ) : (
          row.isActive && (
            <Button variant="ghost" size="sm" href={routes.service(row.slug)}>
              View
            </Button>
          )
        ),
    },
  ];

  return (
    <>
      <PageTitle
        title="Services"
        description={canEdit ? "Services offered on the website and in the booking flow. Duration sets the appointment slot length." : "Services offered on the website and in the booking flow."}
        demo={false}
        actions={
          canEdit && (
            <Button size="sm" leftIcon={Plus} href={`${dashboardRoutes.services}/new`}>
              Add service
            </Button>
          )
        }
      />
      <DataTable columns={columns} rows={services} caption="Service list" emptyMessage="No services yet. Add the first service to enable booking." />
    </>
  );
}
