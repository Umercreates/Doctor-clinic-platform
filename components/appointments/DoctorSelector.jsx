"use client";

import Image from "next/image";
import { Users } from "lucide-react";
import { SelectableCard } from "./SelectableCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { WEEKDAY_LABELS } from "@/data/doctors";

function workingDays(doctor) {
  return doctor.schedule.map((s) => WEEKDAY_LABELS[s.day].slice(0, 3)).join(", ");
}

/**
 * Step 1: choose a doctor. Shows a compact card per doctor with photo, role,
 * and working days. Emits the full doctor record so the reducer can validate
 * the currently selected service against it.
 */
export function DoctorSelector({ doctors = [], selectedId, onSelect }) {
  if (!doctors.length) {
    return <EmptyState icon={Users} title="No doctors available" description="Please contact the clinic to book by phone." />;
  }

  return (
    <fieldset>
      <legend className="sr-only">Choose a doctor</legend>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {doctors.map((doctor) => (
          <SelectableCard
            key={doctor.id}
            name="doctor"
            value={doctor.id}
            checked={selectedId === doctor.id}
            onChange={() => onSelect(doctor)}
            ariaLabel={`${doctor.name}, ${doctor.role}`}
            className="flex-col"
          >
            <div className="flex items-center gap-4 pr-8">
              <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-slate-900 ring-1 ring-slate-200">
                <Image
                  src={doctor.photo.src}
                  alt=""
                  fill
                  sizes="64px"
                  className="object-cover"
                  style={{ objectPosition: doctor.photo.position }}
                />
              </span>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-slate-900">{doctor.name}</p>
                <p className="truncate text-sm text-brand-600">{doctor.role}</p>
              </div>
            </div>
            <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-600">{doctor.shortBio}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <Badge variant="neutral">{workingDays(doctor)}</Badge>
              {doctor.acceptingNewPatients && (
                <Badge variant="success" dot>
                  New patients
                </Badge>
              )}
            </div>
          </SelectableCard>
        ))}
      </div>
    </fieldset>
  );
}
