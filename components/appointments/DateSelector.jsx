"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { addDays, addMonths, buildMonthGrid, formatMonthYear, isSameDay, parseIsoDate, startOfMonth, toIsoDate } from "@/lib/dates";
import { APPOINTMENT_LIMITS } from "@/lib/validation/appointment";
import { hasBookableTime } from "@/lib/booking";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/**
 * Step 3: month calendar.
 *
 * Days are enabled only when the availability API reports at least one open
 * slot (schedule, blocked dates and existing bookings all considered). While
 * the month's availability loads, the weekly schedule is used as a fast
 * approximation and the grid is marked busy. Supports arrow-key navigation.
 */
export function DateSelector({ doctor, service, value, onChange }) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const maxDate = useMemo(() => addDays(today, APPOINTMENT_LIMITS.maxDaysAhead), [today]);

  const [month, setMonth] = useState(() => startOfMonth(value ? parseIsoDate(value) : today));
  const [focusedIso, setFocusedIso] = useState(value || toIsoDate(today));
  // { key, days: Set<string> | null (unknown), error }
  const [availableDays, setAvailableDays] = useState({ key: null, days: null, error: "" });

  const cells = useMemo(() => buildMonthGrid(month), [month]);
  const canGoPrev = startOfMonth(month) > startOfMonth(today);
  const canGoNext = startOfMonth(addMonths(month, 1)) <= startOfMonth(maxDate);

  const slotMinutes = service?.durationMinutes || APPOINTMENT_LIMITS.defaultSlotMinutes;
  const rangeFrom = toIsoDate(cells[0]);
  const rangeTo = toIsoDate(cells[cells.length - 1]);
  const requestKey = `${doctor?.id}|${service?.id}|${rangeFrom}|${rangeTo}`;

  useEffect(() => {
    if (!doctor || !service) return undefined;
    const controller = new AbortController();
    const key = requestKey;
    api
      .getAvailableDays({ doctor: doctor.id, service: service.id, from: rangeFrom, to: rangeTo }, { signal: controller.signal })
      .then((response) => setAvailableDays({ key, days: new Set(response.data.days || []), error: "" }))
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setAvailableDays({ key, days: null, error: err.message || "Could not load availability." });
      });
    return () => controller.abort();
  }, [doctor, service, rangeFrom, rangeTo, requestKey]);

  const loading = availableDays.key !== requestKey;
  const known = !loading && availableDays.days instanceof Set;

  const isDisabled = (date) => {
    if (date < today || date > maxDate) return true;
    if (known) return !availableDays.days.has(toIsoDate(date));
    // Fallback while loading / on error: weekly schedule + lead time.
    return !hasBookableTime(doctor, date, slotMinutes);
  };

  const moveFocus = (fromIso, days) => {
    const next = addDays(parseIsoDate(fromIso), days);
    if (next < today || next > maxDate) return;
    setFocusedIso(toIsoDate(next));
    if (next.getMonth() !== month.getMonth() || next.getFullYear() !== month.getFullYear()) {
      setMonth(startOfMonth(next));
    }
    window.requestAnimationFrame(() => {
      document.getElementById(`day-${toIsoDate(next)}`)?.focus();
    });
  };

  const onKeyDown = (event, iso) => {
    const map = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    if (map[event.key] !== undefined) {
      event.preventDefault();
      moveFocus(iso, map[event.key]);
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMonth((m) => addMonths(m, -1))}
          disabled={!canGoPrev}
          aria-label="Previous month"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40"
        >
          <ChevronLeft className="h-4.5 w-4.5" aria-hidden="true" />
        </button>
        <p className="inline-flex items-center gap-2 text-base font-semibold text-slate-900" aria-live="polite">
          {formatMonthYear(month)}
          {loading && <Loader2 className="h-4 w-4 animate-spin text-brand-500" aria-label="Checking availability" />}
        </p>
        <button
          type="button"
          onClick={() => setMonth((m) => addMonths(m, 1))}
          disabled={!canGoNext}
          aria-label="Next month"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40"
        >
          <ChevronRight className="h-4.5 w-4.5" aria-hidden="true" />
        </button>
      </div>

      <div role="grid" aria-label={`Available dates in ${formatMonthYear(month)}`} aria-busy={loading} className={cn("mt-5 transition-opacity", loading && "opacity-70")}>
        <div role="row" className="grid grid-cols-7 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
          {WEEKDAYS.map((day) => (
            <div key={day} role="columnheader" className="py-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((date) => {
            const iso = toIsoDate(date);
            const inMonth = date.getMonth() === month.getMonth();
            const disabled = isDisabled(date);
            const selected = value === iso;
            const isToday = isSameDay(date, today);
            const tabbable = focusedIso === iso;
            return (
              <div key={iso} role="gridcell" aria-selected={selected} className="flex justify-center">
                <button
                  type="button"
                  id={`day-${iso}`}
                  disabled={disabled}
                  tabIndex={tabbable ? 0 : -1}
                  onKeyDown={(event) => onKeyDown(event, iso)}
                  onFocus={() => setFocusedIso(iso)}
                  onClick={() => onChange(iso)}
                  aria-label={date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                  aria-pressed={selected}
                  className={cn(
                    "relative flex h-11 w-full max-w-[3rem] items-center justify-center rounded-xl text-sm font-medium transition-all duration-150",
                    !inMonth && "text-slate-300",
                    inMonth && !disabled && !selected && "bg-brand-50/70 text-slate-800 hover:bg-brand-100 hover:text-brand-800",
                    inMonth && disabled && "text-slate-300",
                    selected && "bg-brand-600 text-white shadow-brand",
                    disabled && "cursor-not-allowed",
                  )}
                >
                  {date.getDate()}
                  {isToday && (
                    <span
                      aria-hidden="true"
                      className={cn("absolute bottom-1.5 h-1 w-1 rounded-full", selected ? "bg-white" : "bg-accent-500")}
                    />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {availableDays.error && !loading && (
        <p className="mt-3 text-xs text-amber-700" role="status">
          Live availability could not be loaded; showing the regular schedule instead.
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-brand-50 ring-1 ring-inset ring-brand-200" aria-hidden="true" />
          Available
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-brand-600" aria-hidden="true" />
          Selected
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-500" aria-hidden="true" />
          Today
        </span>
        <span className="ml-auto">Book up to {APPOINTMENT_LIMITS.maxDaysAhead} days ahead</span>
      </div>
    </div>
  );
}
