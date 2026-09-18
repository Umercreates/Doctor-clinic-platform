import { Filter, Download } from "lucide-react";
import { PageTitle } from "@/components/dashboard/PageTitle";
import { DataTable } from "@/components/dashboard/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatTime12h } from "@/lib/dates";
import { demoAppointments, appointmentStatusMeta } from "@/data/dashboard";
import { listDoctors } from "@/server/repositories/doctorsRepository";
import { listServices } from "@/server/repositories/servicesRepository";

export const metadata = { title: "Appointments" };

export default async function DashboardAppointmentsPage() {
  const [doctors, services] = await Promise.all([listDoctors(), listServices()]);
  const doctorName = (id) => doctors.find((d) => d.id === id)?.name || "—";
  const serviceName = (id) => services.find((s) => s.id === id)?.name || "—";

  const columns = [
    { key: "reference", label: "Reference", render: (row) => <span className="font-mono text-xs font-semibold text-slate-900">{row.reference}</span> },
    { key: "patient", label: "Patient" },
    { key: "doctorId", label: "Doctor", render: (row) => doctorName(row.doctorId) },
    { key: "serviceId", label: "Service", render: (row) => serviceName(row.serviceId) },
    { key: "date", label: "Date" },
    { key: "time", label: "Time", render: (row) => formatTime12h(row.time) },
    {
      key: "status",
      label: "Status",
      render: (row) => <Badge variant={appointmentStatusMeta[row.status].variant}>{appointmentStatusMeta[row.status].label}</Badge>,
    },
  ];

  const counts = Object.keys(appointmentStatusMeta).map((status) => ({
    status,
    count: demoAppointments.filter((a) => a.status === status).length,
  }));

  return (
    <>
      <PageTitle
        title="Appointments"
        description="Review booking requests, confirm visits, and manage the schedule."
        actions={
          <>
            <Button variant="secondary" size="sm" leftIcon={Filter}>
              Filter
            </Button>
            <Button variant="secondary" size="sm" leftIcon={Download}>
              Export
            </Button>
          </>
        }
      />
      <div className="mb-6 flex flex-wrap gap-2" aria-label="Status summary">
        {counts.map(({ status, count }) => (
          <Badge key={status} variant={appointmentStatusMeta[status].variant} className="px-3 py-1.5">
            {appointmentStatusMeta[status].label}: {count}
          </Badge>
        ))}
      </div>
      <DataTable columns={columns} rows={demoAppointments} caption="All appointments" />
    </>
  );
}
