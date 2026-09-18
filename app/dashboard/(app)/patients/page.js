import { UserPlus } from "lucide-react";
import { PageTitle } from "@/components/dashboard/PageTitle";
import { DataTable } from "@/components/dashboard/DataTable";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { demoPatients } from "@/data/dashboard";

export const metadata = { title: "Patients" };

const columns = [
  { key: "name", label: "Patient", render: (row) => <span className="font-medium text-slate-900">{row.name}</span> },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "lastVisit", label: "Last visit" },
  { key: "visits", label: "Visits", className: "text-right" },
];

export default function DashboardPatientsPage() {
  return (
    <>
      <PageTitle
        title="Patients"
        description="Patient records created through online bookings and front-desk registrations."
        actions={
          <Button size="sm" leftIcon={UserPlus}>
            Add patient
          </Button>
        }
      />
      <Alert tone="info" className="mb-6" title="Privacy">
        Names shown here are fictional placeholders. Real patient data is stored securely in PostgreSQL with role-based access in a later phase.
      </Alert>
      <DataTable columns={columns} rows={demoPatients} caption="Patient list" />
    </>
  );
}
