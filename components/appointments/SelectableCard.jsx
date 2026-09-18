"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Radio-style option card used by the doctor and service selectors.
 * Renders a real <input type="radio"> for accessibility.
 */
export function SelectableCard({ name, value, checked, onChange, disabled = false, className, children, ariaLabel }) {
  return (
    <label
      className={cn(
        "group relative flex cursor-pointer rounded-3xl border bg-white p-4 shadow-soft transition-all duration-200 sm:p-5",
        "has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-brand-100",
        checked
          ? "border-brand-500 ring-2 ring-brand-500/25 shadow-card"
          : "border-slate-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card",
        disabled && "cursor-not-allowed opacity-60 hover:translate-y-0",
        className,
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        aria-label={ariaLabel}
        className="sr-only"
      />
      <span
        aria-hidden="true"
        className={cn(
          "absolute right-4 top-4 inline-flex h-6 w-6 items-center justify-center rounded-full border transition-all duration-200",
          checked ? "scale-100 border-brand-600 bg-brand-600 text-white" : "scale-90 border-slate-300 bg-white text-transparent",
        )}
      >
        <Check className="h-3.5 w-3.5" />
      </span>
      {children}
    </label>
  );
}
