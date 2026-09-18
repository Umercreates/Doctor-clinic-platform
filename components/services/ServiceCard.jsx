import Link from "next/link";
import { ArrowRight, CalendarCheck, Clock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

/**
 * Reusable service card.
 *
 * Props:
 *  - service: service record from data/services.js (or the API)
 *  - doctors: optional list of related doctor records for the "with" line
 *  - variant: "default" | "compact"
 */
export function ServiceCard({ service, doctors = [], variant = "default", className }) {
  const detailHref = routes.service(service.slug);
  const bookHref = routes.bookWith({ service: service.slug });
  const compact = variant === "compact";
  const related = doctors.filter((d) => service.doctorIds.includes(d.id));

  return (
    <Card interactive as="article" className={cn("group flex h-full flex-col", compact ? "p-6" : "p-6 sm:p-7", className)}>
      <div className="flex items-start justify-between gap-4">
        <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100 transition-colors duration-300 group-hover:bg-brand-600 group-hover:text-white">
          <Icon name={service.icon} className="h-5.5 w-5.5" />
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
          {service.durationMinutes} min
        </span>
      </div>

      <h3 className="mt-5 text-lg font-semibold text-slate-900 sm:text-xl">
        <Link href={detailHref} className="rounded-sm transition-colors hover:text-brand-700">
          {service.name}
        </Link>
      </h3>
      <p className="mt-2 text-[0.95rem] leading-relaxed text-slate-600">{service.shortDescription}</p>

      {!compact && related.length > 0 && (
        <p className="mt-4 text-sm text-slate-500">
          <span className="font-medium text-slate-700">With: </span>
          {related.map((doctor, index) => (
            <span key={doctor.id}>
              <Link href={routes.doctor(doctor.slug)} className="link-underline rounded-sm text-brand-700">
                {doctor.name}
              </Link>
              {index < related.length - 1 ? ", " : ""}
            </span>
          ))}
        </p>
      )}

      <div className="mt-auto flex flex-col gap-2 pt-6 sm:flex-row sm:items-center">
        <Button href={detailHref} variant="ghost" size="sm" rightIcon={ArrowRight} className="justify-start px-3 sm:flex-1">
          Learn More
        </Button>
        <Button href={bookHref} size="sm" leftIcon={CalendarCheck} className="sm:flex-1">
          Book Appointment
        </Button>
      </div>
    </Card>
  );
}
