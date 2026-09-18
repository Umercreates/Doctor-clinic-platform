import Image from "next/image";
import Link from "next/link";
import { CalendarCheck, Check, Clock, Languages, MapPin, MessageCircle } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { DemoNotice } from "@/components/ui/DemoNotice";
import { routes } from "@/lib/routes";
import { formatTime12h } from "@/lib/dates";
import { WEEKDAY_LABELS } from "@/data/doctors";

/**
 * Full doctor profile used by /doctors/[id].
 * Composed of a header, biography, care areas, services, and a sticky booking panel.
 */
export function DoctorProfile({ doctor, services = [] }) {
  const bookHref = routes.bookWith({ doctor: doctor.slug });

  return (
    <>
      <header className="relative overflow-hidden bg-hero-glow">
        <div className="bg-grid-soft pointer-events-none absolute inset-0" aria-hidden="true" />
        <Container className="relative py-10 sm:py-14 lg:py-20">
          <Breadcrumbs items={[{ label: "Doctors", href: routes.doctors }, { label: doctor.name }]} className="animate-fade-in" />
          <div className="mt-8 grid items-center gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-sm lg:max-w-none">
                <div className="relative aspect-[4/4.6] overflow-hidden rounded-[2rem] bg-slate-100 shadow-lift ring-1 ring-slate-900/10 animate-image-reveal">
                  <Image
                    src={doctor.photo.src}
                    alt={doctor.photo.alt}
                    fill
                    priority
                    sizes="(min-width: 1024px) 40vw, (min-width: 640px) 384px, 100vw"
                    className="object-cover"
                    style={{ objectPosition: doctor.photo.position }}
                  />
                </div>
              </div>
            </div>
            <div className="lg:col-span-7">
              <div className="flex flex-wrap gap-2 animate-slide-up">
                {doctor.isLead && <Badge variant="brand">Primary Doctor</Badge>}
                {doctor.acceptingNewPatients && (
                  <Badge variant="success" dot>
                    Accepting new patients
                  </Badge>
                )}
              </div>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 animate-slide-up sm:text-5xl lg:text-[3.5rem]" style={{ animationDelay: "60ms" }}>
                {doctor.name}
              </h1>
              <p className="mt-3 text-lg font-medium text-brand-600 animate-slide-up" style={{ animationDelay: "120ms" }}>
                {doctor.role}
                {doctor.roleIsDemo && <span className="ml-2 text-sm font-normal text-slate-400">(demo role)</span>}
              </p>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600 animate-slide-up sm:text-lg" style={{ animationDelay: "180ms" }}>
                {doctor.shortBio}
              </p>
              <dl className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-600 animate-slide-up" style={{ animationDelay: "240ms" }}>
                <div className="inline-flex items-center gap-2">
                  <dt className="sr-only">Location</dt>
                  <MapPin className="h-4 w-4 text-brand-600" aria-hidden="true" />
                  <dd>{doctor.location}</dd>
                </div>
                <div className="inline-flex items-center gap-2">
                  <dt className="sr-only">Languages</dt>
                  <Languages className="h-4 w-4 text-brand-600" aria-hidden="true" />
                  <dd>{doctor.languages.join(", ")}</dd>
                </div>
              </dl>
              <div className="mt-8 flex flex-col gap-3 animate-slide-up sm:flex-row" style={{ animationDelay: "300ms" }}>
                <Button href={bookHref} size="lg" leftIcon={CalendarCheck}>
                  Book with {doctor.name}
                </Button>
                <Button href={routes.contact} variant="secondary" size="lg" leftIcon={MessageCircle}>
                  Ask a question
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </header>

      <Section tone="white" aria-label={`About ${doctor.name}`}>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="space-y-14 lg:col-span-8">
            <Reveal as="section" aria-labelledby="doctor-bio">
              <h2 id="doctor-bio" className="text-2xl font-bold text-slate-900 sm:text-3xl">
                About {doctor.name}
              </h2>
              <div className="mt-5 space-y-4 text-base leading-relaxed text-slate-600">
                {doctor.bio.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              {doctor.bioIsDemo && <DemoNotice className="mt-4" text="Biography is demo content pending verified information." />}
            </Reveal>

            <Reveal as="section" aria-labelledby="doctor-care-areas">
              <h2 id="doctor-care-areas" className="text-2xl font-bold text-slate-900 sm:text-3xl">
                Areas of care
              </h2>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {doctor.careAreas.map((area) => (
                  <li key={area} className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-soft">
                    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-50 text-accent-600 ring-1 ring-inset ring-accent-100">
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                    <span className="text-[0.95rem] text-slate-800">{area}</span>
                  </li>
                ))}
              </ul>
              {doctor.careAreasAreDemo && <DemoNotice className="mt-4" text="Areas of care are demo content. Not a statement of specialty or certification." />}
            </Reveal>

            <Reveal as="section" aria-labelledby="doctor-services">
              <h2 id="doctor-services" className="text-2xl font-bold text-slate-900 sm:text-3xl">
                Services you can book
              </h2>
              <ul className="mt-5 grid gap-4 sm:grid-cols-2">
                {services.map((service) => (
                  <li key={service.id}>
                    <Card interactive className="group flex h-full items-start gap-4 p-5">
                      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                        <Icon name={service.icon} className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-slate-900">
                          <Link href={routes.service(service.slug)} className="rounded-sm hover:text-brand-700">
                            {service.name}
                          </Link>
                        </h3>
                        <p className="mt-1 text-sm text-slate-600">{service.shortDescription}</p>
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                            {service.durationMinutes} min
                          </span>
                          <Link
                            href={routes.bookWith({ doctor: doctor.slug, service: service.slug })}
                            className="link-underline rounded-sm text-sm font-semibold text-brand-700"
                          >
                            Book this
                          </Link>
                        </div>
                      </div>
                    </Card>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          {/* Sticky booking panel */}
          <aside className="lg:col-span-4" aria-label="Booking and availability">
            <Reveal delay={120} className="lg:sticky lg:top-28">
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-slate-900">Typical availability</h2>
                <dl className="mt-4 divide-y divide-slate-100 text-sm">
                  {doctor.schedule.map((day) => (
                    <div key={day.day} className="flex items-start justify-between gap-4 py-2.5">
                      <dt className="font-medium text-slate-800">{WEEKDAY_LABELS[day.day]}</dt>
                      <dd className="text-right tabular-nums text-slate-600">
                        {day.blocks.map((block) => (
                          <span key={`${block.start}-${block.end}`} className="block">
                            {formatTime12h(block.start)} – {formatTime12h(block.end)}
                          </span>
                        ))}
                      </dd>
                    </div>
                  ))}
                </dl>
                {doctor.scheduleIsDemo && <DemoNotice className="mt-4" text="Demo schedule — live availability is shown during booking." />}
                <Button href={bookHref} fullWidth size="lg" leftIcon={CalendarCheck} className="mt-6">
                  Book Appointment
                </Button>
                <p className="mt-3 text-center text-xs text-slate-500">Online booking takes about two minutes.</p>
              </Card>
            </Reveal>
          </aside>
        </div>
      </Section>
    </>
  );
}
