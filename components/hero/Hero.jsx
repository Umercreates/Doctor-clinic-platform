import Image from "next/image";
import { CalendarCheck, Clock, MapPin, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { routes } from "@/lib/routes";
import { clinic } from "@/data/clinic";

const highlights = [
  { icon: CalendarCheck, label: "Online booking in minutes" },
  { icon: Clock, label: "Same-week appointments" },
  { icon: ShieldCheck, label: "Patient-centered care" },
];

/**
 * Homepage hero featuring Dr. Williams (provided photo).
 */
export function Hero({ doctor }) {
  return (
    <section className="relative overflow-hidden bg-hero-glow" aria-labelledby="hero-heading">
      <div className="bg-grid-soft pointer-events-none absolute inset-0" aria-hidden="true" />
      <Container className="relative">
        <div className="grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-12 lg:gap-8 lg:py-28">
          {/* Copy */}
          <div className="lg:col-span-6 xl:col-span-6">
            <div className="animate-slide-up">
              <Badge variant="brand" className="px-3 py-1.5 text-[0.8rem]">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                {clinic.city}, {clinic.stateFull}
                <span className="mx-1 text-brand-300" aria-hidden="true">
                  ·
                </span>
                Accepting new patients
              </Badge>
            </div>

            <h1
              id="hero-heading"
              className="mt-6 text-[2.6rem] font-bold leading-[1.05] tracking-tight text-slate-900 animate-slide-up sm:text-6xl lg:text-[4.1rem] xl:text-[4.6rem]"
              style={{ animationDelay: "80ms" }}
            >
              Thoughtful care,
              <br />
              <span className="bg-gradient-to-r from-brand-600 to-accent-500 bg-clip-text text-transparent">
                built around you.
              </span>
            </h1>

            <p
              className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600 animate-slide-up sm:text-xl"
              style={{ animationDelay: "160ms" }}
            >
              {clinic.name} is a modern medical practice in {clinic.city}, led by {doctor.name}. Unhurried
              appointments, clear communication, and care plans built around your life.
            </p>

            <div className="mt-8 flex flex-col gap-3 animate-slide-up sm:flex-row" style={{ animationDelay: "240ms" }}>
              <Button href={routes.appointments} size="xl" leftIcon={CalendarCheck} className="sm:min-w-[13rem]">
                Book Appointment
              </Button>
              <Button href={routes.contact} variant="secondary" size="xl" leftIcon={MessageCircle}>
                Contact the clinic
              </Button>
            </div>

            <ul
              className="mt-10 flex flex-col gap-3 text-sm text-slate-600 animate-slide-up sm:flex-row sm:flex-wrap sm:gap-x-6"
              style={{ animationDelay: "320ms" }}
              aria-label="Practice highlights"
            >
              {highlights.map((item) => (
                <li key={item.label} className="inline-flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent-50 text-accent-600 ring-1 ring-inset ring-accent-100">
                    <item.icon className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  {item.label}
                </li>
              ))}
            </ul>
          </div>

          {/* Portrait */}
          <div className="relative lg:col-span-6 xl:col-span-6">
            <div className="relative mx-auto max-w-md lg:ml-auto lg:max-w-lg">
              <div
                aria-hidden="true"
                className="absolute -inset-6 -z-10 rounded-[2.75rem] bg-gradient-to-br from-brand-100 via-white to-accent-100 opacity-80 blur-2xl"
              />
              <div className="relative aspect-[4/4.5] overflow-hidden rounded-[2rem] bg-slate-100 shadow-lift ring-1 ring-slate-900/10 animate-image-reveal">
                <Image
                  src={doctor.photo.src}
                  alt={doctor.photo.alt}
                  fill
                  priority
                  fetchPriority="high"
                  sizes="(min-width: 1280px) 520px, (min-width: 1024px) 45vw, (min-width: 640px) 448px, 100vw"
                  className="object-cover"
                  style={{ objectPosition: doctor.photo.position }}
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-950/45 via-transparent to-transparent" aria-hidden="true" />

                {/* Name plate */}
                <div className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-3 rounded-2xl bg-white/90 p-4 shadow-card backdrop-blur-md sm:inset-x-5 sm:bottom-5">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-slate-900">{doctor.name}</p>
                    <p className="truncate text-sm text-slate-600">
                      {doctor.role} · {clinic.city}
                    </p>
                  </div>
                  <Button href={routes.doctor(doctor.slug)} size="sm" variant="outline" className="shrink-0">
                    Profile
                  </Button>
                </div>
              </div>

              {/* Floating chip */}
              <div
                className="absolute -right-3 top-8 hidden items-center gap-2.5 rounded-2xl border border-slate-200/80 bg-white/95 px-4 py-3 shadow-card backdrop-blur-md animate-float sm:flex lg:-right-8"
                aria-hidden="true"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div className="text-sm">
                  <p className="font-semibold text-slate-900">Book online</p>
                  <p className="text-slate-500">Choose your doctor & time</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
