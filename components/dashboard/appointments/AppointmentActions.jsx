"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Check, CheckCircle2, Eye, UserX, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { RescheduleDialog } from "./RescheduleDialog";
import { api } from "@/lib/api";
import { dashboardRoutes } from "@/lib/routes";
import { canTransition, RESCHEDULABLE_STATUSES } from "@/lib/validation/appointmentAdmin";

/**
 * Status actions for one appointment. Every action calls the API (which
 * re-validates permissions and transitions) and refreshes the server data.
 *
 * variant="row"  compact icon buttons for tables
 * variant="full" labelled buttons for the detail page
 */
export function AppointmentActions({ appointment, variant = "row" }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(null); // action key in flight
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [rescheduleOpen, setRescheduleOpen] = useState(false);

  const status = appointment.status;
  const can = (next) => canTransition(status, next) && status !== next;
  const full = variant === "full";

  const run = async (key, fn, successMessage) => {
    setBusy(key);
    try {
      await fn();
      toast.success(successMessage);
      router.refresh();
      return true;
    } catch (error) {
      toast.error(error.message || "Something went wrong. Please try again.");
      return false;
    } finally {
      setBusy(null);
    }
  };

  const confirm = () => run("confirm", () => api.updateAppointment(appointment.id, { status: "confirmed" }), `Appointment ${appointment.reference} confirmed.`);
  const complete = () => run("complete", () => api.updateAppointment(appointment.id, { status: "completed" }), `Appointment ${appointment.reference} marked completed.`);
  const noShow = () => run("no_show", () => api.updateAppointment(appointment.id, { status: "no_show" }), `Appointment ${appointment.reference} marked as no-show.`);
  const cancel = async () => {
    const ok = await run("cancel", () => api.cancelAppointment(appointment.id, cancelReason.trim() || undefined), `Appointment ${appointment.reference} cancelled. The slot is available again.`);
    if (ok) setCancelOpen(false);
  };

  const size = full ? "md" : "sm";
  const iconOnly = !full;
  const label = (text) => (iconOnly ? undefined : text);

  return (
    <div className={full ? "flex flex-wrap gap-2" : "flex items-center justify-end gap-1"}>
      {!full && (
        <Button href={`${dashboardRoutes.appointments}/${appointment.id}`} variant="ghost" size="sm" aria-label="View details" title="View details" className="px-2">
          <Eye className="h-4 w-4" aria-hidden="true" />
        </Button>
      )}
      {can("confirmed") && (
        <Button onClick={confirm} loading={busy === "confirm"} size={size} variant={full ? "primary" : "ghost"} aria-label="Confirm" title="Confirm" className={iconOnly ? "px-2 text-emerald-700" : undefined} leftIcon={full ? Check : undefined}>
          {iconOnly ? <Check className="h-4 w-4" aria-hidden="true" /> : label("Confirm")}
        </Button>
      )}
      {can("completed") && (
        <Button onClick={complete} loading={busy === "complete"} size={size} variant={full ? "secondary" : "ghost"} aria-label="Mark completed" title="Mark completed" className={iconOnly ? "px-2 text-brand-700" : undefined} leftIcon={full ? CheckCircle2 : undefined}>
          {iconOnly ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : label("Mark completed")}
        </Button>
      )}
      {RESCHEDULABLE_STATUSES.includes(status) && (
        <Button onClick={() => setRescheduleOpen(true)} size={size} variant={full ? "secondary" : "ghost"} aria-label="Reschedule" title="Reschedule" className={iconOnly ? "px-2 text-slate-700" : undefined} leftIcon={full ? CalendarClock : undefined}>
          {iconOnly ? <CalendarClock className="h-4 w-4" aria-hidden="true" /> : label("Reschedule")}
        </Button>
      )}
      {full && can("no_show") && (
        <Button onClick={noShow} loading={busy === "no_show"} size={size} variant="secondary" leftIcon={UserX}>
          No-show
        </Button>
      )}
      {can("cancelled") && (
        <Button onClick={() => setCancelOpen(true)} size={size} variant="ghost" aria-label="Cancel appointment" title="Cancel appointment" className={iconOnly ? "px-2 text-rose-600" : "text-rose-700"} leftIcon={full ? XCircle : undefined}>
          {iconOnly ? <XCircle className="h-4 w-4" aria-hidden="true" /> : label("Cancel appointment")}
        </Button>
      )}

      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={cancel}
        busy={busy === "cancel"}
        title="Cancel this appointment?"
        description={`${appointment.patient?.fullName || "The patient"} will lose the ${appointment.time ? appointment.time : ""} slot on ${appointment.date}. The slot becomes available to others immediately.`}
        confirmLabel="Cancel appointment"
        cancelLabel="Keep appointment"
      >
        <label htmlFor={`cancel-reason-${appointment.id}`} className="text-sm font-medium text-slate-800">
          Reason (optional)
        </label>
        <input
          id={`cancel-reason-${appointment.id}`}
          value={cancelReason}
          onChange={(event) => setCancelReason(event.target.value)}
          maxLength={300}
          placeholder="e.g. Patient requested"
          className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-900 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100"
        />
      </ConfirmDialog>

      {rescheduleOpen && (
        <RescheduleDialog
          appointment={appointment}
          open={rescheduleOpen}
          onClose={() => setRescheduleOpen(false)}
          onRescheduled={(updated) => {
            setRescheduleOpen(false);
            toast.success(`Appointment ${updated.reference} moved to ${updated.date} at ${updated.time}.`);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
