"use client";

import { CalendarDays, CheckCircle2, Clock, Home, Mail, MapPin, PlusCircle, Stethoscope, UserRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { formatLongDate, formatTime12h } from "@/lib/dates";
import { routes } from "@/lib/routes";
import { clinic } from "@/data/clinic";

const nextSteps = [
  "Check your email for a confirmation message with your reference number.",
  "Our team reviews new requests during opening hours and will contact you if anything needs to change.",
  "Please arrive a few minutes early and bring a photo ID and any relevant records.",
];

/**
 * Step 7: confirmation. Displays the reference returned by the API.
 */
export function BookingConfirmation({ confirmation, onBookAnother }) {
  const { reference, doctor, service, date, time, patient } = confirmation;

  return (
    <div className="animate-slide-up" role="status" aria-live="polite">
      <div className="text-center">
        <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/60">
          <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
        </span>
        <h2 className="mt-5 text-2xl font-bold text-slate-900 sm:text-3xl">Your appointment request is in</h2>
        <p className="mx-auto mt-3 max-w-md text-base text-slate-600">
          Thank you, {patient.fullName.split(" ")[0]}. We have received your request and sent a confirmation to{" "}
          <span className="font-medium text-slate-900">{patient.email}</span>.
        </p>
        <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold tracking-wide text-white">
          Reference <span className="font-mono text-accent-300">{reference}</span>
        </p>
      </div>

      <dl className="mt-8 grid gap-3 rounded-3xl border border-slate-200 bg-slate-50/70 p-5 sm:grid-cols-2 sm:p-6">
        {[
          { icon: UserRound, label: "Doctor", value: `${doctor.name} · ${doctor.role}` },
          { icon: Stethoscope, label: "Service", value: service.name },
          { icon: CalendarDays, label: "Date", value: formatLongDate(date) },
          { icon: Clock, label: "Time", value: formatTime12h(time) },
          { icon: MapPin, label: "Location", value: `${clinic.address.line1}, ${clinic.address.city}` },
          { icon: Mail, label: "Contact", value: patient.email },
        ].map((item) => (
          <div key={item.label} className="flex items-start gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200/80">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100">
              <item.icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{item.label}</dt>
              <dd className="mt-0.5 break-words text-sm font-medium text-slate-900">{item.value}</dd>
            </div>
          </div>
        ))}
      </dl>

      <div className="mt-8">
        <h3 className="text-base font-semibold text-slate-900">What happens next</h3>
        <ol className="mt-3 space-y-2.5">
          {nextSteps.map((step, index) => (
            <li key={step} className="flex gap-3 text-sm leading-relaxed text-slate-600">
              <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-50 text-xs font-bold text-accent-700 ring-1 ring-inset ring-accent-100">
                {index + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      {confirmation.isDemo && (
        <Alert tone="info" className="mt-8" title="Demo environment">
          This booking was recorded in a demo environment only. No email has been sent and no appointment has been scheduled with the clinic.
        </Alert>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button onClick={onBookAnother} variant="secondary" size="lg" leftIcon={PlusCircle}>
          Book another appointment
        </Button>
        <Button href={routes.home} size="lg" leftIcon={Home}>
          Back to home
        </Button>
      </div>
    </div>
  );
}
