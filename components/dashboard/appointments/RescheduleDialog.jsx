"use client";

import { useEffect, useState } from "react";
import { CalendarX2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/api";
import { formatLongDate, formatTime12h, todayIso } from "@/lib/dates";
import { cn } from "@/lib/utils";

/**
 * Pick a new date, load the real slots for that day (the appointment's own
 * slot counts as free), choose one and submit. Conflicts refresh the list.
 */
export function RescheduleDialog({ appointment, open, onClose, onRescheduled }) {
  const [date, setDate] = useState(appointment?.date || todayIso());
  const [time, setTime] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [result, setResult] = useState({ key: null, slots: [], error: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const requestKey = `${appointment?.id}|${date}|${reloadKey}`;

  useEffect(() => {
    if (!open || !appointment?.id || !date) return undefined;
    const controller = new AbortController();
    const key = requestKey;
    api
      .getRescheduleOptions(appointment.id, date, { signal: controller.signal })
      .then((response) => setResult({ key, slots: response.data.slots || [], error: "" }))
      .catch((error) => {
        if (error?.name === "AbortError") return;
        setResult({ key, slots: [], error: error.message || "Could not load available times." });
      });
    return () => controller.abort();
  }, [open, appointment?.id, date, requestKey]);

  const loading = result.key !== requestKey;
  const available = result.slots.filter((s) => s.available);
  const unchanged = date === appointment?.date && time === appointment?.time;

  const submit = async () => {
    if (!time) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const response = await api.rescheduleAppointment(appointment.id, { date, time });
      onRescheduled?.(response.data);
    } catch (error) {
      if (error.code === "SLOT_UNAVAILABLE") {
        setSubmitError("This slot was just booked. Please select another time.");
        setTime(null);
        setReloadKey((k) => k + 1);
      } else {
        setSubmitError(error.details?.time || error.details?.date || error.message || "Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={submitting ? undefined : onClose}
      title="Reschedule appointment"
      description={`${appointment?.patient?.fullName} with ${appointment?.doctor?.name} · currently ${formatLongDate(appointment?.date, { weekday: "short", month: "short" })} at ${formatTime12h(appointment?.time)}`}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!time || unchanged} loading={submitting}>
            Move appointment
          </Button>
        </>
      }
    >
      {submitError && (
        <Alert tone="warning" className="mb-4">
          {submitError}
        </Alert>
      )}
      <label htmlFor="reschedule-date" className="text-sm font-medium text-slate-800">
        New date
      </label>
      <input
        id="reschedule-date"
        type="date"
        min={todayIso()}
        value={date}
        onChange={(event) => {
          setDate(event.target.value);
          setTime(null);
        }}
        className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-900 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100 sm:max-w-xs"
      />

      <p className="mt-5 text-sm font-medium text-slate-800">Available times</p>
      <div className="mt-2 min-h-[6rem]">
        {loading ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4" aria-busy="true">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : result.error ? (
          <Alert tone="error">{result.error}</Alert>
        ) : !available.length ? (
          <div className="flex items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
            <CalendarX2 className="h-5 w-5 text-slate-400" aria-hidden="true" />
            No appointments are available for this date. Please choose another date.
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Available times">
            {result.slots.map((slot) => {
              const selected = time === slot.startTime;
              const isCurrent = slot.startTime === appointment?.time && date === appointment?.date;
              return (
                <button
                  key={slot.startTime}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={!slot.available}
                  onClick={() => setTime(slot.startTime)}
                  className={cn(
                    "h-10 rounded-xl border text-sm font-medium tabular-nums transition-colors",
                    selected && "border-brand-600 bg-brand-600 text-white",
                    !selected && slot.available && "border-slate-200 bg-white text-slate-800 hover:border-brand-300 hover:bg-brand-50",
                    !slot.available && "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300 line-through",
                    isCurrent && !selected && "ring-2 ring-accent-300",
                  )}
                  title={isCurrent ? "Current time" : `${formatTime12h(slot.startTime)} – ${formatTime12h(slot.endTime)}`}
                >
                  {formatTime12h(slot.startTime)}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}
