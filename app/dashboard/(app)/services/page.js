import { Pencil, Plus } from "lucide-react";
import { PageTitle } from "@/components/dashboard/PageTitle";
import { DataTable } from "@/components/dashboard/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { listServices } from "@/server/repositories/servicesRepository";

export const metadata = { title: "Services" };

export default async function DashboardServicesPage() {
  const services = await listServices();

  const columns = [
    {
      key: "name",
      label: "Service",
      render: (row) => (
        <span className="inline-flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100">
            <Icon name={row.icon} className="h-4 w-4" />
          </span>
          <span className="font-medium text-slate-900">{row.name}</span>
        </span>
      ),
    },
    { key: "durationMinutes", label: "Duration", render: (row) => `${row.durationMinutes} min` },
    { key: "doctorIds", label: "Doctors", render: (row) => row.doctorIds.length },
    { key: "isActive", label: "Status", render: (row) => <Badge variant={row.isActive ? "success" : "neutral"} dot>{row.isActive ? "Published" : "Hidden"}</Badge> },
    {
      key: "actions",
      label: "",
      className: "text-right",
      render: () => (
        <Button variant="ghost" size="sm" leftIcon={Pencil}>
          Edit
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageTitle
        title="Services"
        description="Services offered on the website and in the booking flow."
        actions={
          <Button size="sm" leftIcon={Plus}>
            Add service
          </Button>
        }
      />
      <DataTable columns={columns} rows={services} caption="Service list" />
    </>
  );
}
