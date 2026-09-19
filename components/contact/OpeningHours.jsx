import { formatTime12h } from "@/lib/dates";
import { cn } from "@/lib/utils";

/**
 * Opening hours table driven by clinic.hours (website settings). Highlights today's row.
 */
export function OpeningHours({ clinic, className, highlightToday = true }) {
  const today = new Date().getDay();
  const ordered = [...(clinic.hours?.schedule || [])].sort((a, b) => ((a.day + 6) % 7) - ((b.day + 6) % 7));

  return (
    <dl className={cn("divide-y divide-slate-100 text-sm", className)}>
      {ordered.map((day) => {
        const isToday = highlightToday && day.day === today;
        return (
          <div
            key={day.day}
            className={cn("flex items-center justify-between gap-4 py-2.5", isToday && "font-semibold text-brand-700")}
          >
            <dt className="flex items-center gap-2">
              {day.label}
              {isToday && (
                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-brand-700 ring-1 ring-inset ring-brand-100">
                  Today
                </span>
              )}
            </dt>
            <dd className={cn("tabular-nums", !day.open && "text-slate-400")}>
              {day.open ? `${formatTime12h(day.open)} – ${formatTime12h(day.close)}` : "Closed"}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
