"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, addMonths, buildMonthGrid, formatMonthYear, isSameDay, parseIsoDate, startOfMonth, toIsoDate } from "@/lib/dates";
import { APPOINTMENT_LIMITS } from "@/lib/validation/appointment";
import { hasBookableTime } from "@/lib/booking";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/**
 * Step 3: month calendar. Disables past days, days beyond the booking window,
 * and weekdays the doctor does not work. Supports arrow-key navigation.
 */
export function DateSelector({ doctor, service, value, onChange }) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const maxDate = useMemo(() => addDays(today, APPOINTMENT_LIMITS.maxDaysAhead), [today]);
  const workingDays = useMemo(() => new Set(doctor?.schedule.map((s) => s.day) || []), [doctor]);

  const [month, setMonth] = useState(() => startOfMonth(value ? parseIsoDate(value) : today));
  const [focusedIso, setFocusedIso] = useState(value || toIsoDate(today));

  const cells = useMemo(() => buildMonthGrid(month), [month]);
  const canGoPrev = startOfMonth(month) > startOfMonth(today);
  const canGoNext = startOfMonth(addMonths(month, 1)) <= startOfMonth(maxDate);

  const slotMinutes = service?.durationMinutes || APPOINTMENT_LIMITS.defaultSlotMinutes;
  const isDisabled = (date) =>
    date < today || date > maxDate || !workingDays.has(date.getDay()) || !hasBookableTime(doctor, date, slotMinutes);

  const moveFocus = (fromIso, days) => {
    const next = addDays(parseIsoDate(fromIso), days);
    if (next < today || next > maxDate) return;
    setFocusedIso(toIsoDate(next));
    if (next.getMonth() !== month.getMonth() || next.getFullYear() !== month.getFullYear()) {
      setMonth(startOfMonth(next));
    }
    // Focus after the grid re-renders
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
        <p className="text-base font-semibold text-slate-900" aria-live="polite">
          {formatMonthYear(month)}
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

      <div role="grid" aria-label={`Available dates in ${formatMonthYear(month)}`} className="mt-5">
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
