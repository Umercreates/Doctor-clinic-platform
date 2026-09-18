import { PageTitle } from "@/components/dashboard/PageTitle";
import { DataTable } from "@/components/dashboard/DataTable";
import { Alert } from "@/components/ui/Alert";
import { formatLongDate } from "@/lib/dates";
import { dashboardRoutes } from "@/lib/routes";
import { requirePageScope } from "@/server/auth/pageGuards";
import { listPatientsForScope } from "@/server/services/patientService";

export const metadata = { title: "Patients" };
export const dynamic = "force-dynamic";

const columns = [
  { key: "fullName", label: "Patient", render: (row) => <span className="font-medium text-slate-900">{row.fullName}</span> },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  {
    key: "lastAppointmentDate",
    label: "Last appointment",
    render: (row) => (row.lastAppointmentDate ? formatLongDate(row.lastAppointmentDate, { weekday: undefined, month: "short" }) : "—"),
  },
  { key: "appointmentCount", label: "Visits", className: "text-right" },
];

export default async function DashboardPatientsPage({ searchParams }) {
  const params = await searchParams;
  const { scope } = await requirePageScope("patients:read", dashboardRoutes.patients);
  const search = (params.search || "").toString().slice(0, 100);
  const result = await listPatientsForScope(scope, { search, limit: 50 });

  return (
    <>
      <PageTitle
        title="Patients"
        description={scope.all ? "Patient records created through online bookings." : "Patients who have booked an appointment with you."}
        demo={false}
      />
      <Alert tone="info" className="mb-6" title="Privacy">
        Only contact details needed to manage appointments are stored. Access is limited by role and every request is checked server-side.
      </Alert>
      <form method="get" className="mb-4 flex max-w-md gap-2" role="search">
        <label htmlFor="patient-search" className="sr-only">
          Search patients
        </label>
        <input
          id="patient-search"
          name="search"
          defaultValue={search}
          placeholder="Search by name, email or phone"
          className="h-10 w-full rounded-full border border-slate-200 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-300 focus:outline-none focus:ring-4 focus:ring-brand-100"
        />
        <button type="submit" className="h-10 rounded-full bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800">
          Search
        </button>
      </form>
      <DataTable
        columns={columns}
        rows={result.items}
        caption="Patient list"
        emptyMessage={search ? "No patients match that search." : "No patients yet. Records appear here after the first online booking."}
      />
      <p className="mt-3 text-xs text-slate-500">
        Showing {result.items.length} of {result.total}
      </p>
    </>
  );
}
