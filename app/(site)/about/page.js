import Image from "next/image";
import { ArrowRight, CalendarCheck, Compass, Target } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { CtaSection } from "@/components/layout/CtaSection";
import { DoctorGrid } from "@/components/doctors/DoctorGrid";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { DemoNotice } from "@/components/ui/DemoNotice";
import { buildMetadata } from "@/lib/metadata";
import { routes } from "@/lib/routes";
import { getClinicSettings, getLeadDoctorCached, getPublicDoctors, getSiteContent } from "@/server/services/contentService";

export async function generateMetadata() {
  const [clinic, leadDoctor] = await Promise.all([getClinicSettings(), getLeadDoctorCached()]);
  const led = leadDoctor ? `, led by ${leadDoctor.name}` : "";
  return buildMetadata({
    title: "About the practice",
    description: `Learn about ${clinic.name}, a patient-centered medical practice in ${clinic.city}, ${clinic.stateFull}${led}. Our mission, values, and approach to care.`,
    path: routes.about,
    siteName: clinic.name,
  });
}

export default async function AboutPage() {
  const [clinic, content, leadDoctor, doctors] = await Promise.all([getClinicSettings(), getSiteContent(), getLeadDoctorCached(), getPublicDoctors()]);
  const intro = content["about.intro"];
  const purpose = content["about.mission"];
  const values = content["about.values"];
  const approach = content["about.approach"];

  return (
    <>
      <PageHeader
        eyebrow={intro.eyebrow}
        title={intro.title}
        description={intro.description}
        breadcrumbs={[{ label: "About" }]}
        actions={
          <>
            <Button href={routes.appointments} size="lg" leftIcon={CalendarCheck}>
              Book Appointment
            </Button>
            <Button href={routes.doctors} variant="secondary" size="lg" rightIcon={ArrowRight}>
              Meet the doctors
            </Button>
          </>
        }
      />

      {/* Practice introduction + lead doctor */}
      <Section tone="white" aria-labelledby="practice-intro">
        <div className={`grid items-center gap-12 lg:gap-16 ${leadDoctor ? "lg:grid-cols-12" : ""}`}>
          <div className={leadDoctor ? "lg:col-span-7" : ""}>
            <Reveal>
              <SectionHeading eyebrow={intro.sectionEyebrow} title={intro.sectionTitle} description={intro.sectionDescription} />
            </Reveal>
            {leadDoctor && (
              <Reveal delay={100} className="prose-slate mt-8 space-y-4 text-[0.95rem] leading-relaxed text-slate-600 sm:text-base">
                {leadDoctor.bio.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {leadDoctor.bioIsDemo && <DemoNotice text="Biography is demo content pending verified information from the practice." />}
              </Reveal>
            )}
          </div>
          {leadDoctor && (
          <Reveal variant="right" className="lg:col-span-5">
            <div className="relative mx-auto max-w-sm lg:max-w-none">
              <div className="relative aspect-[4/4.6] overflow-hidden rounded-[2rem] bg-slate-100 shadow-card ring-1 ring-slate-900/10">
                <Image
                  src={leadDoctor.photo.src}
                  alt={leadDoctor.photo.alt}
                  fill
                  priority
                  sizes="(min-width: 1024px) 40vw, (min-width: 640px) 384px, 100vw"
                  className="object-cover"
                  style={{ objectPosition: leadDoctor.photo.position }}
                />
              </div>
              <div className="absolute -bottom-5 left-4 right-4 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-slate-900">{leadDoctor.name}</p>
                  <p className="truncate text-sm text-slate-500">
                    {leadDoctor.role} · {clinic.city}
                  </p>
                </div>
                <Button href={routes.doctor(leadDoctor.slug)} size="sm" variant="outline" className="shrink-0">
                  Profile
                </Button>
              </div>
            </div>
          </Reveal>
          )}
        </div>
      </Section>

      {/* Mission & vision */}
      <Section tone="muted" aria-labelledby="mission-heading">
        <Reveal>
          <SectionHeading eyebrow="Purpose" title="Our mission and vision" align="center" />
        </Reveal>
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <Reveal delay={80} className="rounded-3xl border border-slate-200/80 bg-white p-8 shadow-soft">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100">
              <Target className="h-5.5 w-5.5" aria-hidden="true" />
            </span>
            <h3 className="mt-5 text-xl font-semibold text-slate-900">Mission</h3>
            <p className="mt-3 text-base leading-relaxed text-slate-600">{purpose.mission}</p>
          </Reveal>
          <Reveal delay={160} className="rounded-3xl border border-slate-200/80 bg-white p-8 shadow-soft">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-50 text-accent-600 ring-1 ring-inset ring-accent-100">
              <Compass className="h-5.5 w-5.5" aria-hidden="true" />
            </span>
            <h3 className="mt-5 text-xl font-semibold text-slate-900">Vision</h3>
            <p className="mt-3 text-base leading-relaxed text-slate-600">{purpose.vision}</p>
          </Reveal>
        </div>
      </Section>

      {/* Values */}
      <Section tone="white" aria-labelledby="values-heading">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <Reveal className="lg:sticky lg:top-28">
              <SectionHeading eyebrow={values.eyebrow} title={values.title} description={values.description} />
            </Reveal>
          </div>
          <ul className="grid gap-5 sm:grid-cols-2 lg:col-span-8">
            {values.items.map((value, index) => (
              <Reveal as="li" key={`${index}-${value.title}`} delay={index * 80}>
                <div className="group h-full rounded-3xl border border-slate-200/80 bg-white p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lift">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                    <Icon name={value.icon || "check"} className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">{value.title}</h3>
                  <p className="mt-1.5 text-[0.95rem] leading-relaxed text-slate-600">{value.description}</p>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </Section>

      {/* Patient care approach */}
      <Section tone="subtle" aria-labelledby="approach-heading">
        <Reveal>
          <SectionHeading eyebrow={approach.eyebrow} title={approach.title} description={approach.description} align="center" />
        </Reveal>
        <ol className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {approach.steps.map((step, index) => (
            <Reveal as="li" key={`${index}-${step.title}`} delay={index * 90}>
              <div className="h-full rounded-3xl border border-slate-200/80 bg-white p-6 shadow-soft">
                <Badge variant="accent">Step {index + 1}</Badge>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-slate-600">{step.description}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </Section>

      {/* Team */}
      <Section tone="white" aria-labelledby="team-heading">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <Reveal>
            <SectionHeading
              eyebrow="Our team"
              title="The doctors you will meet"
              description={`${doctors.length === 1 ? "One doctor" : `${doctors.length} doctors`}, one shared approach to attentive, patient-centered care.`}
            />
          </Reveal>
          <Reveal delay={120} className="shrink-0">
            <Button href={routes.doctors} variant="secondary" rightIcon={ArrowRight}>
              View all profiles
            </Button>
          </Reveal>
        </div>
        <div className="mt-12">
          <DoctorGrid doctors={doctors} variant="compact" />
        </div>
      </Section>

      <CtaSection
        eyebrow="Become a patient"
        title="We would be glad to welcome you"
        description="Book a first consultation online or contact the clinic and we will help you get started."
      />
    </>
  );
}
