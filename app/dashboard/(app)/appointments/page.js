import Link from "next/link";
import { PageTitle } from "@/components/dashboard/PageTitle";
import { DataTable } from "@/components/dashboard/DataTable";
import { AppointmentFilters } from "@/components/dashboard/appointments/AppointmentFilters";
import { AppointmentActions } from "@/components/dashboard/appointments/AppointmentActions";
import { StatusBadge } from "@/components/dashboard/appointments/StatusBadge";
import { formatLongDate, formatTime12h, isIsoDate } from "@/lib/dates";
import { dashboardRoutes } from "@/lib/routes";
import { isUuid } from "@/lib/validation/common";
import { APPOINTMENT_STATUS_VALUES } from "@/lib/validation/appointmentAdmin";
import { requirePageScope } from "@/server/auth/pageGuards";
import { listAppointmentsForUser } from "@/server/services/appointmentService";
import { listDoctors } from "@/server/repositories/doctorsRepository";

export const metadata = { title: "Appointments" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

export default async function DashboardAppointmentsPage({ searchParams }) {
  const params = await searchParams;
  const { scope } = await requirePageScope("appointments:read", dashboardRoutes.appointments);

  const filters = {
    status: APPOINTMENT_STATUS_VALUES.includes(params.status) ? params.status : undefined,
    date: isIsoDate(params.date) ? params.date : undefined,
    doctorId: scope.all && isUuid(params.doctorId) ? params.doctorId : undefined,
    search: (params.search || "").toString().trim().slice(0, 100) || undefined,
  };
  const page = Math.max(1, Number.parseInt(params.page || "1", 10) || 1);

  const [result, doctors] = await Promise.all([
    listAppointmentsForUser(scope, { ...filters, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }),
    scope.all ? listDoctors() : [],
  ]);
  const totalPages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));

  const columns = [
    {
      key: "reference",
      label: "Reference",
      render: (row) => (
        <Link href={`${dashboardRoutes.appointments}/${row.id}`} className="font-mono text-xs font-semibold text-brand-700 hover:underline">
          {row.reference}
        </Link>
      ),
    },
    { key: "patient", label: "Patient", render: (row) => <span className="font-medium text-slate-900">{row.patient?.fullName}</span> },
    { key: "doctor", label: "Doctor", render: (row) => row.doctor?.name },
    { key: "service", label: "Service", render: (row) => row.service?.name },
    { key: "date", label: "Date", render: (row) => formatLongDate(row.date, { weekday: "short", month: "short" }) },
    { key: "time", label: "Time", render: (row) => `${formatTime12h(row.time)} – ${formatTime12h(row.endTime)}` },
    { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> },
    { key: "actions", label: "", className: "text-right", render: (row) => <AppointmentActions appointment={row} /> },
  ];

  const query = new URLSearchParams(Object.entries(filters).filter(([, v]) => v));
  const pageHref = (p) => `${dashboardRoutes.appointments}?${new URLSearchParams({ ...Object.fromEntries(query), page: String(p) })}`;

  return (
    <>
      <PageTitle
        title="Appointments"
        description={scope.all ? "All booking requests and scheduled visits, live from the database." : "Your booking requests and scheduled visits."}
        demo={false}
      />

      <AppointmentFilters doctors={doctors} values={filters} showDoctorFilter={scope.all} />

      <DataTable
        columns={columns}
        rows={result.items}
        caption="Appointments"
        emptyMessage={
          Object.values(filters).some(Boolean)
            ? "No appointments match these filters."
            : "No appointments yet. New online bookings appear here automatically."
        }
      />

      <nav className="mt-4 flex items-center justify-between text-sm text-slate-600" aria-label="Pagination">
        <span>
          {result.total} appointment{result.total === 1 ? "" : "s"}
          {totalPages > 1 ? ` · page ${page} of ${totalPages}` : ""}
        </span>
        {totalPages > 1 && (
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={pageHref(page - 1)} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 hover:bg-slate-50">
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link href={pageHref(page + 1)} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 hover:bg-slate-50">
                Next
              </Link>
            )}
          </div>
        )}
      </nav>
    </>
  );
}
