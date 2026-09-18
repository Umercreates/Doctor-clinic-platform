"use client";

import { Check } from "lucide-react";
import { VISIBLE_STEPS } from "./steps";
import { cn } from "@/lib/utils";

/**
 * Progress indicator. Completed steps are clickable so patients can go back
 * and change a choice; future steps are not.
 */
export function StepIndicator({ currentIndex, onNavigate, completedIndex }) {
  const total = VISIBLE_STEPS.length;
  const isDone = currentIndex >= total;
  const displayIndex = Math.min(currentIndex, total - 1);
  const progress = isDone ? 100 : Math.round(((displayIndex + 1) / total) * 100);

  return (
    <nav aria-label="Booking progress">
      {/* Mobile: compact bar */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between text-sm">
          <p className="font-semibold text-slate-900">
            {isDone ? "Complete" : `Step ${displayIndex + 1} of ${total}`}
          </p>
          <p className="text-slate-500">{isDone ? "Appointment requested" : VISIBLE_STEPS[displayIndex].title}</p>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
          <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-400 transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Desktop: step list */}
      <ol className="hidden items-center gap-2 lg:flex">
        {VISIBLE_STEPS.map((step, index) => {
          const complete = isDone || index < currentIndex;
          const current = !isDone && index === currentIndex;
          const reachable = complete && !isDone && index <= completedIndex;
          return (
            <li key={step.id} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => reachable && onNavigate(index)}
                disabled={!reachable}
                aria-current={current ? "step" : undefined}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3 text-sm font-medium transition-colors",
                  current && "bg-brand-50 text-brand-700",
                  complete && !current && "text-slate-700 hover:bg-slate-100",
                  !complete && !current && "text-slate-400",
                  !reachable && "cursor-default",
                )}
              >
                <span
                  className={cn(
                    "inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors",
                    current && "bg-brand-600 text-white",
                    complete && !current && "bg-accent-500 text-white",
                    !complete && !current && "bg-slate-200 text-slate-500",
                  )}
                >
                  {complete && !current ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : index + 1}
                </span>
                {step.label}
              </button>
              {index < total - 1 && (
                <span className={cn("h-px w-6 rounded-full", index < currentIndex ? "bg-accent-400" : "bg-slate-200")} aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
