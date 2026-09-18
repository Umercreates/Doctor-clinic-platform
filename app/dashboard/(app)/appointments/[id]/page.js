import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock, Mail, NotebookPen, Phone, Stethoscope, UserRound } from "lucide-react";
import { PageTitle } from "@/components/dashboard/PageTitle";
import { AppointmentActions } from "@/components/dashboard/appointments/AppointmentActions";
import { StatusBadge } from "@/components/dashboard/appointments/StatusBadge";
import { Card } from "@/components/ui/Card";
import { formatLongDate, formatTime12h } from "@/lib/dates";
import { dashboardRoutes } from "@/lib/routes";
import { isUuid } from "@/lib/validation/common";
import { requirePageUser } from "@/server/auth/pageGuards";
import { canAccessDoctorRecord } from "@/server/auth/permissions";
import { getAppointmentById } from "@/server/repositories/appointmentsRepository";

export const metadata = { title: "Appointment" };
export const dynamic = "force-dynamic";

function Row({ icon: IconComponent, label, children }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100">
        <IconComponent className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</dt>
        <dd className="mt-0.5 break-words text-sm text-slate-900">{children}</dd>
      </div>
    </div>
  );
}

function formatStamp(value) {
  if (!value) return null;
  return new Date(value).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

export default async function AppointmentDetailPage({ params }) {
  const { id } = await params;
  const path = `${dashboardRoutes.appointments}/${id}`;
  const user = await requirePageUser(path);
  if (!isUuid(id)) notFound();

  const appointment = await getAppointmentById(id);
  if (!appointment) notFound();
  // Doctors may only open their own appointments (enforced here and in the API).
  if (!canAccessDoctorRecord(user, "appointments:read", appointment.doctorId)) notFound();

  const history = [
    { label: "Requested", at: appointment.createdAt },
    { label: "Confirmed", at: appointment.confirmedAt },
    { label: `Rescheduled${appointment.rescheduledFrom ? ` (from ${appointment.rescheduledFrom.date} ${formatTime12h(appointment.rescheduledFrom.time)})` : ""}`, at: appointment.rescheduledAt },
    { label: "Completed", at: appointment.completedAt },
    { label: `Cancelled${appointment.cancelReason ? ` — ${appointment.cancelReason}` : ""}`, at: appointment.cancelledAt },
  ].filter((h) => h.at);

  return (
    <>
      <Link href={dashboardRoutes.appointments} className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        All appointments
      </Link>
      <PageTitle
        title={
          <span className="inline-flex flex-wrap items-center gap-3">
            <span className="font-mono">{appointment.reference}</span>
            <StatusBadge status={appointment.status} />
          </span>
        }
        description={`${appointment.service?.name} with ${appointment.doctor?.name}`}
        demo={false}
        actions={<AppointmentActions appointment={appointment} variant="full" />}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-slate-900">Visit</h2>
          <dl className="mt-2 divide-y divide-slate-100">
            <Row icon={CalendarDays} label="Date">
              {formatLongDate(appointment.date)}
            </Row>
            <Row icon={Clock} label="Time">
              {formatTime12h(appointment.time)} – {formatTime12h(appointment.endTime)} ({appointment.durationMinutes} min)
            </Row>
            <Row icon={Stethoscope} label="Service">
              {appointment.service?.name}
            </Row>
            <Row icon={UserRound} label="Doctor">
              {appointment.doctor?.name} · {appointment.doctor?.role}
            </Row>
            <Row icon={NotebookPen} label="Patient notes">
              {appointment.patientNotes || <span className="text-slate-400">None</span>}
            </Row>
          </dl>

          {history.length > 0 && (
            <>
              <h3 className="mt-6 text-sm font-semibold text-slate-900">History</h3>
              <ol className="mt-2 space-y-1.5 text-sm text-slate-600">
                {history.map((h) => (
                  <li key={h.label} className="flex justify-between gap-4">
                    <span>{h.label}</span>
                    <span className="shrink-0 tabular-nums text-slate-500">{formatStamp(h.at)}</span>
                  </li>
                ))}
              </ol>
            </>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-900">Patient</h2>
          <dl className="mt-2 divide-y divide-slate-100">
            <Row icon={UserRound} label="Name">
              {appointment.patient?.fullName}
            </Row>
            <Row icon={Mail} label="Email">
              <a href={`mailto:${appointment.patient?.email}`} className="text-brand-700 hover:underline">
                {appointment.patient?.email}
              </a>
            </Row>
            <Row icon={Phone} label="Phone">
              <a href={`tel:${appointment.patient?.phone}`} className="text-brand-700 hover:underline">
                {appointment.patient?.phone}
              </a>
            </Row>
          </dl>
          <p className="mt-4 text-xs text-slate-500">Contact details only. No clinical records are stored in this system.</p>
        </Card>
      </div>
    </>
  );
}
