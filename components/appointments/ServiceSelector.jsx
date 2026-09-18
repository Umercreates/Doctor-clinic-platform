"use client";

import { Clock, Stethoscope } from "lucide-react";
import { SelectableCard } from "./SelectableCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";

/**
 * Step 2: choose a service. Only services the selected doctor offers are shown.
 */
export function ServiceSelector({ services = [], selectedId, onSelect, doctorName }) {
  if (!services.length) {
    return (
      <EmptyState
        icon={Stethoscope}
        title="No services available"
        description={`${doctorName || "This doctor"} has no bookable services right now. Please choose another doctor.`}
      />
    );
  }

  return (
    <fieldset>
      <legend className="sr-only">Choose a service</legend>
      <div className="grid gap-4 sm:grid-cols-2">
        {services.map((service) => (
          <SelectableCard
            key={service.id}
            name="service"
            value={service.id}
            checked={selectedId === service.id}
            onChange={() => onSelect(service.id)}
            ariaLabel={`${service.name}, ${service.durationMinutes} minutes`}
            className="flex-col"
          >
            <div className="flex items-start gap-4 pr-8">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100">
                <Icon name={service.icon} className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-base font-semibold text-slate-900">{service.name}</p>
                <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-slate-500">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  {service.durationMinutes} minutes
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">{service.shortDescription}</p>
          </SelectableCard>
        ))}
      </div>
    </fieldset>
  );
}
