import Link from "next/link";
import { ArrowRight, CalendarPlus, Clock } from "lucide-react";
import { PageTitle } from "@/components/dashboard/PageTitle";
import { StatCard } from "@/components/dashboard/StatCard";
import { DataTable } from "@/components/dashboard/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { formatTime12h, todayIso } from "@/lib/dates";
import { dashboardRoutes, routes } from "@/lib/routes";
import { appointmentStatusMeta } from "@/data/dashboard";
import { requirePageScope } from "@/server/auth/pageGuards";
import { getDashboardSummary } from "@/server/services/appointmentService";
import { countPatientsForScope } from "@/server/services/patientService";
import { listDoctors } from "@/server/repositories/doctorsRepository";
import { listServices } from "@/server/repositories/servicesRepository";
import { can } from "@/server/auth/permissions";

export const metadata = { title: "Overview" };
export const dynamic = "force-dynamic";

export default async function DashboardOverviewPage({ searchParams }) {
  const { denied } = await searchParams;
  const { user, scope } = await requirePageScope("appointments:read", dashboardRoutes.root);
  const today = todayIso();

  const [summary, patientCount, doctors, services] = await Promise.all([
    getDashboardSummary(scope, today),
    countPatientsForScope(scope),
    listDoctors(),
    listServices(),
  ]);
  const visibleDoctors = scope.all ? doctors : doctors.filter((d) => d.id === scope.doctorId);
  const isAdmin = can(user, "doctors:write");
  const doctorsWithoutHours = doctors.filter((d) => !d.schedule.some((day) => day.blocks.length));

  // Every figure below is counted from the database for the user's scope.
  const stats = [
    { id: "today", label: "Appointments today", value: String(summary.today), change: "Active bookings", trend: "flat" },
    { id: "week", label: "Next 7 days", value: String(summary.upcomingWeek), change: "Booked from today", trend: "flat" },
    { id: "pending", label: "Pending requests", value: String(summary.byStatus.pending), change: summary.byStatus.pending ? "Needs review" : "All reviewed", trend: summary.byStatus.pending ? "attention" : "up" },
    { id: "patients", label: scope.all ? "Patients" : "My patients", value: String(patientCount), change: "On record", trend: "flat" },
  ];

  const columns = [
    { key: "time", label: "Time", render: (row) => <span className="font-medium text-slate-900">{formatTime12h(row.time)}</span> },
    { key: "patient", label: "Patient", render: (row) => row.patient?.fullName },
    { key: "doctor", label: "Doctor", render: (row) => row.doctor?.name },
    { key: "service", label: "Service", render: (row) => row.service?.name },
    {
      key: "status",
      label: "Status",
      render: (row) => <Badge variant={appointmentStatusMeta[row.status]?.variant || "neutral"}>{appointmentStatusMeta[row.status]?.label || row.status}</Badge>,
    },
  ];

  return (
    <>
      <PageTitle
        title={`Welcome back, ${user.name.split(" ")[0]}`}
        description={scope.all ? "A snapshot of today at the practice." : "A snapshot of your day."}
        demo={false}
        actions={
          <Button href={routes.appointments} size="sm" leftIcon={CalendarPlus}>
            New booking
          </Button>
        }
      />

      {denied === "1" && (
        <Alert tone="warning" className="mb-6" title="Access restricted">
          Your account does not have permission to open that section.
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.id} {...stat} />
        ))}
      </div>

      {isAdmin && doctorsWithoutHours.length > 0 && (
        <Alert tone="warning" className="mt-6" title="Doctors without weekly hours">
          {doctorsWithoutHours.map((d) => d.name).join(", ")} cannot be booked until weekly hours are set.{" "}
          <Link href={dashboardRoutes.schedule} className="font-medium underline underline-offset-2">
            Open the schedule
          </Link>
          .
        </Alert>
      )}

      <div className="mt-8 grid gap-6 xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Today&apos;s appointments</h2>
            <Link href={dashboardRoutes.appointments} className="link-underline inline-flex items-center gap-1 rounded-sm text-sm font-medium text-brand-700">
              View all
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <DataTable columns={columns} rows={summary.todayAppointments} caption="Appointments scheduled for today" emptyMessage="No appointments scheduled for today." />
        </div>

        <div className="space-y-6">
          {isAdmin && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-slate-900">Website</h2>
              <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Active doctors</dt>
                  <dd className="mt-1 text-2xl font-bold text-slate-900">{doctors.length}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Active services</dt>
                  <dd className="mt-1 text-2xl font-bold text-slate-900">{services.length}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Confirmed</dt>
                  <dd className="mt-1 text-2xl font-bold text-slate-900">{summary.byStatus.confirmed}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Completed</dt>
                  <dd className="mt-1 text-2xl font-bold text-slate-900">{summary.byStatus.completed}</dd>
                </div>
              </dl>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button href={dashboardRoutes.content} variant="secondary" size="sm">
                  Edit content
                </Button>
                <Button href={dashboardRoutes.settings} variant="secondary" size="sm">
                  Settings
                </Button>
              </div>
            </Card>
          )}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-slate-900">{scope.all ? "Doctors" : "Your profile"}</h2>
            <ul className="mt-4 divide-y divide-slate-100">
              {visibleDoctors.map((doctor) => (
                <li key={doctor.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{doctor.name}</p>
                    <p className="text-xs text-slate-500">{doctor.role}</p>
                  </div>
                  <Badge variant={doctor.acceptingNewPatients ? "success" : "neutral"} dot>
                    {doctor.acceptingNewPatients ? "Accepting patients" : "Not accepting"}
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
              {summary.byStatus.pending} booking request{summary.byStatus.pending === 1 ? " is" : "s are"} waiting for confirmation.
            </p>
            <Button href={`${dashboardRoutes.appointments}?status=pending`} variant="secondary" size="sm" className="mt-4" rightIcon={ArrowRight}>
              Review requests
            </Button>
          </Card>
        </div>
      </div>
    </>
  );
}
