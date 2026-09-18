"use client";

import { forwardRef, useId } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const controlBase =
  "block w-full rounded-xl border bg-white px-4 text-[0.95rem] text-slate-900 shadow-[inset_0_1px_2px_rgb(15_23_42_/_0.04)] transition-colors duration-200 placeholder:text-slate-400 focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";

const controlTone = (invalid) =>
  invalid
    ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
    : "border-slate-200 hover:border-slate-300 focus:border-brand-400 focus:ring-brand-100";

function FieldShell({ id, label, hint, error, required, optional, children, className }) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-slate-800">
          {label}
          {required && (
            <span className="ml-0.5 text-rose-500" aria-hidden="true">
              *
            </span>
          )}
        </label>
        {optional && <span className="text-xs text-slate-400">Optional</span>}
      </div>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs font-medium text-rose-600" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function describedBy(id, error, hint) {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}

export const Input = forwardRef(function Input(
  { id: idProp, label, hint, error, required, optional, className, inputClassName, ...props },
  ref,
) {
  const generatedId = useId();
  const id = idProp || generatedId;
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required} optional={optional} className={className}>
      <input
        ref={ref}
        id={id}
        required={required}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={cn(controlBase, "h-12", controlTone(Boolean(error)), inputClassName)}
        {...props}
      />
    </FieldShell>
  );
});

export const Textarea = forwardRef(function Textarea(
  { id: idProp, label, hint, error, required, optional, className, rows = 4, ...props },
  ref,
) {
  const generatedId = useId();
  const id = idProp || generatedId;
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required} optional={optional} className={className}>
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        required={required}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={cn(controlBase, "resize-y py-3 leading-relaxed", controlTone(Boolean(error)))}
        {...props}
      />
    </FieldShell>
  );
});

export const Select = forwardRef(function Select(
  { id: idProp, label, hint, error, required, optional, className, options = [], placeholder, ...props },
  ref,
) {
  const generatedId = useId();
  const id = idProp || generatedId;
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required} optional={optional} className={className}>
      <div className="relative">
        <select
          ref={ref}
          id={id}
          required={required}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={describedBy(id, error, hint)}
          className={cn(controlBase, "h-12 appearance-none pr-10", controlTone(Boolean(error)))}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
      </div>
    </FieldShell>
  );
});
