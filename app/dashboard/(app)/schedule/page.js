import { PageTitle } from "@/components/dashboard/PageTitle";
import { ScheduleManager } from "@/components/dashboard/schedule/ScheduleManager";
import { EmptyState } from "@/components/ui/EmptyState";
import { CalendarClock } from "lucide-react";
import { dashboardRoutes } from "@/lib/routes";
import { requirePageScope } from "@/server/auth/pageGuards";
import { listDoctors } from "@/server/repositories/doctorsRepository";

export const metadata = { title: "Schedule" };
export const dynamic = "force-dynamic";

export default async function DashboardSchedulePage({ searchParams }) {
  const { doctor: requested } = await searchParams;
  const { user, scope } = await requirePageScope("availability:read", dashboardRoutes.schedule);
  // Only active doctors take bookings, so only they can be scheduled.
  const all = await listDoctors();
  const doctors = scope.all ? all : all.filter((d) => d.id === scope.doctorId);
  const canManage = user.role === "admin" || (user.role === "doctor" && Boolean(user.doctorId));
  // ?doctor=<id> (from the doctor editor) preselects that doctor when visible.
  const initialDoctorId = doctors.find((d) => d.id === requested)?.id || doctors[0]?.id;

  return (
    <>
      <PageTitle
        title="Schedule"
        description={
          scope.all
            ? "Weekly working hours and blocked dates per doctor. Changes apply to online booking immediately."
            : "Your weekly working hours and blocked dates. Changes apply to online booking immediately."
        }
        demo={false}
      />
      {doctors.length === 0 ? (
        <EmptyState icon={CalendarClock} title="No doctor profile" description="Your account is not linked to a doctor profile yet. Ask an administrator to link it." />
      ) : (
        <ScheduleManager doctors={doctors.map((d) => ({ id: d.id, name: d.name }))} canManageAll={scope.all} initialDoctorId={initialDoctorId} readOnly={!canManage} />
      )}
    </>
  );
}
