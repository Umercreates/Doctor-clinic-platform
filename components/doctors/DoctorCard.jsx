import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, CalendarCheck, MapPin } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

/**
 * Reusable doctor card.
 *
 * Props:
 *  - doctor: doctor record from data/doctors.js (or the API)
 *  - variant: "default" (photo, bio, care areas, actions) | "compact" (photo, name, role, link)
 *  - priority: prioritize the image (above-the-fold usage)
 */
export function DoctorCard({ doctor, variant = "default", priority = false, className }) {
  const profileHref = routes.doctor(doctor.slug);
  const bookHref = routes.bookWith({ doctor: doctor.slug });
  const compact = variant === "compact";

  return (
    <Card interactive as="article" className={cn("group flex h-full flex-col overflow-hidden", className)}>
      <Link href={profileHref} className="relative block overflow-hidden" aria-label={`View profile of ${doctor.name}`}>
        <div className={cn("relative w-full overflow-hidden bg-slate-100", compact ? "aspect-[4/4.2]" : "aspect-[4/4.6]")}>
          <Image
            src={doctor.photo.src}
            alt={doctor.photo.alt}
            fill
            priority={priority}
            sizes="(min-width: 1280px) 384px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            style={{ objectPosition: doctor.photo.position }}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-900/45 via-transparent to-transparent" aria-hidden="true" />
        </div>
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          {doctor.isLead && (
            <Badge variant="light" className="backdrop-blur-md">
              Primary Doctor
            </Badge>
          )}
          {doctor.acceptingNewPatients && (
            <Badge variant="light" className="backdrop-blur-md" dot>
              Accepting patients
            </Badge>
          )}
        </div>
      </Link>

      <div className={cn("flex flex-1 flex-col", compact ? "p-5" : "p-6")}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">
              <Link href={profileHref} className="rounded-sm transition-colors hover:text-brand-700">
                {doctor.name}
              </Link>
            </h3>
            <p className="mt-1 text-sm font-medium text-brand-600">
              {doctor.role}
              {doctor.roleIsDemo && <span className="ml-1.5 text-xs font-normal text-slate-400">(demo)</span>}
            </p>
          </div>
          <Link
            href={profileHref}
            aria-label={`View profile of ${doctor.name}`}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-all group-hover:border-brand-200 group-hover:bg-brand-50 group-hover:text-brand-700"
          >
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {!compact && (
          <>
            <p className="mt-3 text-[0.95rem] leading-relaxed text-slate-600">{doctor.shortBio}</p>

            <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-slate-500">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              {doctor.location}
            </p>

            {doctor.careAreas?.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Areas of care</p>
                <ul className="mt-2 flex flex-wrap gap-1.5" aria-label={`Areas of care for ${doctor.name}`}>
                  {doctor.careAreas.slice(0, 4).map((area) => (
                    <li key={area}>
                      <Badge variant="neutral">{area}</Badge>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        <div className={cn("mt-auto flex flex-col gap-2 sm:flex-row", compact ? "pt-4" : "pt-6")}>
          <Button href={profileHref} variant="secondary" size="sm" className="sm:flex-1">
            View Profile
          </Button>
          <Button href={bookHref} size="sm" leftIcon={CalendarCheck} className="sm:flex-1">
            Book Appointment
          </Button>
        </div>
      </div>
    </Card>
  );
}
