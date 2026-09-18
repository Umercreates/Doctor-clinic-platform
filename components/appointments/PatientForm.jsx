"use client";

import { Input, Textarea } from "@/components/ui/FormField";
import { APPOINTMENT_LIMITS } from "@/lib/validation/appointment";
import { formatLongDate, formatTime12h } from "@/lib/dates";
import { STEP_INDEX } from "./steps";

function ReadOnlyField({ label, value, onChange }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-slate-800">{label}</span>
      <div className="flex h-12 items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 text-[0.95rem] text-slate-900">
        <span className="truncate">{value}</span>
        <button type="button" onClick={onChange} className="link-underline shrink-0 rounded-sm text-xs font-semibold text-brand-700">
          Change
        </button>
      </div>
    </div>
  );
}

/**
 * Step 5: patient details. Doctor/service/date/time are shown read-only with
 * "Change" shortcuts back to the relevant step.
 */
export function PatientForm({ values, errors, onChange, onJumpTo, doctor, service, date, time, formId = "patient-form", onSubmit }) {
  const update = (field) => (event) => onChange(field, event.target.value);

  return (
    <form id={formId} onSubmit={onSubmit} noValidate className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <ReadOnlyField label="Doctor" value={doctor?.name} onChange={() => onJumpTo(STEP_INDEX.doctor)} />
        <ReadOnlyField label="Service" value={service?.name} onChange={() => onJumpTo(STEP_INDEX.service)} />
        <ReadOnlyField label="Date" value={formatLongDate(date)} onChange={() => onJumpTo(STEP_INDEX.date)} />
        <ReadOnlyField label="Time" value={formatTime12h(time)} onChange={() => onJumpTo(STEP_INDEX.time)} />
      </div>

      <hr className="border-slate-100" />

      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          id="patient-fullName"
          label="Full name"
          name="fullName"
          autoComplete="name"
          placeholder="Jane Doe"
          value={values.fullName}
          onChange={update("fullName")}
          error={errors.fullName}
          maxLength={APPOINTMENT_LIMITS.nameMax}
          required
          className="sm:col-span-2"
        />
        <Input
          id="patient-email"
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          hint="We will send your confirmation here."
          value={values.email}
          onChange={update("email")}
          error={errors.email}
          required
        />
        <Input
          id="patient-phone"
          label="Phone number"
          name="phone"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          placeholder="(213) 555-0100"
          hint="In case we need to reach you about your visit."
          value={values.phone}
          onChange={update("phone")}
          error={errors.phone}
          required
        />
      </div>

      <Textarea
        id="patient-notes"
        label="Appointment notes"
        name="notes"
        rows={4}
        optional
        placeholder="Anything you would like the doctor to know before the visit"
        hint={`${values.notes.length}/${APPOINTMENT_LIMITS.notesMax} characters. Please avoid sharing sensitive details here.`}
        value={values.notes}
        onChange={update("notes")}
        error={errors.notes}
        maxLength={APPOINTMENT_LIMITS.notesMax}
      />
    </form>
  );
}
