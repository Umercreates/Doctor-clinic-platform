"use client";

import Image from "next/image";
import { CalendarDays, Clock, Stethoscope, UserRound, Mail, Phone, NotebookPen } from "lucide-react";
import { formatLongDate, formatTime12h } from "@/lib/dates";
import { STEP_INDEX } from "./steps";
import { cn } from "@/lib/utils";

function SummaryRow({ icon: IconComponent, label, value, placeholder = "Not selected", onEdit, editable = true }) {
  const filled = Boolean(value);
  return (
    <div className="flex items-start gap-3 py-3">
      <span
        className={cn(
          "mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset",
          filled ? "bg-brand-50 text-brand-600 ring-brand-100" : "bg-slate-50 text-slate-400 ring-slate-200",
        )}
      >
        <IconComponent className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
        <p className={cn("mt-0.5 break-words text-sm", filled ? "font-medium text-slate-900" : "text-slate-400")}>
          {value || placeholder}
        </p>
      </div>
      {editable && filled && onEdit && (
        <button type="button" onClick={onEdit} className="link-underline shrink-0 rounded-sm text-xs font-semibold text-brand-700">
          Change
        </button>
      )}
    </div>
  );
}

/**
 * Appointment summary.
 *  - mode="sidebar": compact live summary shown next to the wizard
 *  - mode="review": full summary with patient details for the review step
 */
export function AppointmentSummary({ doctor, service, date, time, patient, mode = "sidebar", onJumpTo, className }) {
  const review = mode === "review";
  const jump = (index) => () => onJumpTo?.(index);

  return (
    <div className={cn("rounded-3xl border border-slate-200 bg-white shadow-soft", review ? "p-6 sm:p-7" : "p-5", className)}>
      {!review && <h2 className="text-base font-semibold text-slate-900">Your appointment</h2>}

      {doctor && (
        <div className={cn("flex items-center gap-3", review ? "mb-2" : "mt-4")}>
          <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-slate-900 ring-1 ring-slate-200">
            <Image src={doctor.photo.src} alt="" fill sizes="48px" className="object-cover" style={{ objectPosition: doctor.photo.position }} />
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900">{doctor.name}</p>
            <p className="truncate text-sm text-slate-500">{doctor.role}</p>
          </div>
        </div>
      )}

      <div className={cn("divide-y divide-slate-100", doctor ? "mt-2" : "mt-2")}>
        {!doctor && <SummaryRow icon={UserRound} label="Doctor" value={null} />}
        <SummaryRow icon={Stethoscope} label="Service" value={service ? `${service.name} · ${service.durationMinutes} min` : null} onEdit={jump(STEP_INDEX.service)} editable={review} />
        <SummaryRow icon={CalendarDays} label="Date" value={date ? formatLongDate(date) : null} onEdit={jump(STEP_INDEX.date)} editable={review} />
        <SummaryRow icon={Clock} label="Time" value={time ? formatTime12h(time) : null} onEdit={jump(STEP_INDEX.time)} editable={review} />
        {review && (
          <>
            <SummaryRow icon={UserRound} label="Patient" value={patient?.fullName} onEdit={jump(STEP_INDEX.details)} />
            <SummaryRow icon={Mail} label="Email" value={patient?.email} onEdit={jump(STEP_INDEX.details)} />
            <SummaryRow icon={Phone} label="Phone" value={patient?.phone} onEdit={jump(STEP_INDEX.details)} />
            <SummaryRow icon={NotebookPen} label="Notes" value={patient?.notes} placeholder="No notes added" onEdit={jump(STEP_INDEX.details)} />
          </>
        )}
      </div>

      {review && doctor && (
        <button type="button" onClick={jump(STEP_INDEX.doctor)} className="link-underline mt-2 rounded-sm text-xs font-semibold text-brand-700">
          Change doctor
        </button>
      )}
    </div>
  );
}
