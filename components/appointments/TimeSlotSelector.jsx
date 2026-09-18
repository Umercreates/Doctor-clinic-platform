"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarX2, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import { formatLongDate, formatTime12h, partOfDay } from "@/lib/dates";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const GROUPS = [
  { id: "morning", label: "Morning" },
  { id: "afternoon", label: "Afternoon" },
  { id: "evening", label: "Evening" },
];

const EMPTY_REASONS = {
  "no-schedule": "The doctor does not hold appointments on this day.",
  blocked: "The doctor is unavailable on this date.",
  "fully-booked": "Every slot on this date is already booked.",
  "outside-booking-window": "This date is outside the online booking window.",
};

/**
 * Step 4: fetches real availability from the API for the chosen
 * doctor/service/date and renders selectable slots grouped by part of day.
 * Slots are { startTime, endTime, available }.
 */
export function TimeSlotSelector({ doctor, service, date, value, onChange, onChangeDate, refreshKey = 0 }) {
  const [reloadKey, setReloadKey] = useState(0);
  // Result of the latest completed request, keyed by its inputs so "loading"
  // is derived (no setState needed when inputs change).
  const [result, setResult] = useState({ key: null, slots: [], reason: null, error: "" });
  const requestKey = `${doctor?.id}|${service?.id || ""}|${date}|${reloadKey}|${refreshKey}`;

  const retry = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    if (!doctor || !service || !date) return undefined;
    const controller = new AbortController();
    const key = requestKey;

    api
      .getAvailability({ doctor: doctor.id, date, service: service.id }, { signal: controller.signal })
      .then((response) => setResult({ key, slots: response.data.slots || [], reason: response.data.reason || null, error: "" }))
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setResult({ key, slots: [], reason: null, error: err.message || "We could not load available times." });
      });

    return () => controller.abort();
  }, [doctor, service, date, requestKey]);

  const status = result.key !== requestKey ? "loading" : result.error ? "error" : "ready";
  const { slots, error, reason } = result;

  if (status === "loading") {
    return (
      <div aria-busy="true" aria-live="polite" className="space-y-6">
        <span className="sr-only">Loading available times</span>
        {[0, 1].map((group) => (
          <div key={group}>
            <Skeleton className="h-4 w-24" />
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-11" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (status === "error") {
    return (
      <Alert
        tone="error"
        title="Could not load available times"
        action={
          <Button size="sm" variant="secondary" leftIcon={RefreshCw} onClick={retry}>
            Try again
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  const available = slots.filter((s) => s.available);
  if (!available.length) {
    return (
      <EmptyState
        icon={CalendarX2}
        title="No appointments are available for this date"
        description={`${EMPTY_REASONS[reason] || `${doctor.name} has no open slots on ${formatLongDate(date)}.`} Please choose another date.`}
        action={
          <Button variant="secondary" size="sm" onClick={onChangeDate}>
            Choose another date
          </Button>
        }
      />
    );
  }

  return (
    <fieldset className="space-y-6">
      <legend className="text-sm text-slate-600">
        Showing times for <span className="font-semibold text-slate-900">{formatLongDate(date)}</span>
        {service && (
          <>
            {" "}
            · {service.durationMinutes} minute {service.name.toLowerCase()}
          </>
        )}
      </legend>
      {GROUPS.map((group) => {
        const items = slots.filter((slot) => partOfDay(slot.startTime) === group.id);
        if (!items.length) return null;
        return (
          <div key={group.id}>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{group.label}</p>
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
              {items.map((slot) => {
                const selected = value === slot.startTime;
                return (
                  <label
                    key={slot.startTime}
                    className={cn(
                      "relative flex h-11 cursor-pointer items-center justify-center rounded-xl border text-sm font-medium tabular-nums transition-all duration-150",
                      "has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-brand-100",
                      selected && "border-brand-600 bg-brand-600 text-white shadow-brand",
                      !selected && slot.available && "border-slate-200 bg-white text-slate-800 hover:border-brand-300 hover:bg-brand-50",
                      !slot.available && "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300 line-through",
                    )}
                    title={`${formatTime12h(slot.startTime)} – ${formatTime12h(slot.endTime)}`}
                  >
                    <input
                      type="radio"
                      name="time"
                      value={slot.startTime}
                      checked={selected}
                      disabled={!slot.available}
                      onChange={() => onChange(slot.startTime)}
                      className="sr-only"
                      aria-label={`${formatTime12h(slot.startTime)} to ${formatTime12h(slot.endTime)}${slot.available ? "" : " (unavailable)"}`}
                    />
                    {formatTime12h(slot.startTime)}
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
    </fieldset>
  );
}
