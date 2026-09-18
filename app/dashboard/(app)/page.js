import Link from "next/link";
import { ArrowRight, CalendarPlus, Clock } from "lucide-react";
import { PageTitle } from "@/components/dashboard/PageTitle";
import { StatCard } from "@/components/dashboard/StatCard";
import { DataTable } from "@/components/dashboard/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatTime12h } from "@/lib/dates";
import { dashboardRoutes, routes } from "@/lib/routes";
import { dashboardStats, demoAppointments, appointmentStatusMeta } from "@/data/dashboard";
import { listDoctors } from "@/server/repositories/doctorsRepository";
import { listServices } from "@/server/repositories/servicesRepository";

export const metadata = { title: "Overview" };

export default async function DashboardOverviewPage() {
  const [doctors, services] = await Promise.all([listDoctors(), listServices()]);
  const doctorName = (id) => doctors.find((d) => d.id === id)?.name || "—";
  const serviceName = (id) => services.find((s) => s.id === id)?.name || "—";
  const today = demoAppointments.filter((a) => a.date === "Today");

  const columns = [
    { key: "time", label: "Time", render: (row) => <span className="font-medium text-slate-900">{formatTime12h(row.time)}</span> },
    { key: "patient", label: "Patient" },
    { key: "doctorId", label: "Doctor", render: (row) => doctorName(row.doctorId) },
    { key: "serviceId", label: "Service", render: (row) => serviceName(row.serviceId) },
    {
      key: "status",
      label: "Status",
      render: (row) => <Badge variant={appointmentStatusMeta[row.status].variant}>{appointmentStatusMeta[row.status].label}</Badge>,
    },
  ];

  return (
    <>
      <PageTitle
        title="Overview"
        description="A snapshot of today at the practice."
        actions={
          <Button href={routes.appointments} size="sm" leftIcon={CalendarPlus}>
            New booking
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardStats.map((stat) => (
          <StatCard key={stat.id} {...stat} />
        ))}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Today&apos;s appointments</h2>
            <Link href={dashboardRoutes.appointments} className="link-underline inline-flex items-center gap-1 rounded-sm text-sm font-medium text-brand-700">
              View all
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <DataTable columns={columns} rows={today} caption="Appointments scheduled for today" />
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-slate-900">Doctors on duty</h2>
            <ul className="mt-4 divide-y divide-slate-100">
              {doctors.map((doctor) => (
                <li key={doctor.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{doctor.name}</p>
                    <p className="text-xs text-slate-500">{doctor.role}</p>
                  </div>
                  <Badge variant="success" dot>
                    Available
                  </Badge>
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-6">
            <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-slate-900">
              <Clock className="h-4.5 w-4.5 text-brand-600" aria-hidden="true" />
              Pending requests
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {demoAppointments.filter((a) => a.status === "pending").length} booking requests are waiting for confirmation.
            </p>
            <Button href={dashboardRoutes.appointments} variant="secondary" size="sm" className="mt-4" rightIcon={ArrowRight}>
              Review requests
            </Button>
          </Card>
        </div>
      </div>
    </>
  );
}
