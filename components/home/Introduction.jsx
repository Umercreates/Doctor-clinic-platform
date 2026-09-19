import Image from "next/image";
import { ArrowRight, HeartHandshake, MessageCircle, UserRound } from "lucide-react";
import { Section } from "@/components/layout/Section";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { DemoNotice } from "@/components/ui/DemoNotice";
import { routes } from "@/lib/routes";

const PILLAR_ICONS = [UserRound, HeartHandshake, MessageCircle];

/** Homepage practice introduction; copy from the `home.introduction` content block. */
export function Introduction({ doctor, content }) {
  const pillars = (content.pillars || []).map((pillar, index) => ({ ...pillar, icon: PILLAR_ICONS[index % PILLAR_ICONS.length] }));

  return (
    <Section tone="white" aria-labelledby="introduction-heading">
      <div className={`grid items-center gap-12 lg:gap-16 ${doctor ? "lg:grid-cols-12" : ""}`}>
        {doctor && (
        <Reveal variant="left" className="lg:col-span-5">
          <div className="relative mx-auto max-w-sm lg:max-w-none">
            <div className="relative aspect-[4/4.6] overflow-hidden rounded-[2rem] bg-slate-100 shadow-card ring-1 ring-slate-900/10">
              <Image
                src={doctor.photo.src}
                alt={doctor.photo.alt}
                fill
                sizes="(min-width: 1024px) 40vw, (min-width: 640px) 384px, 100vw"
                className="object-cover"
                style={{ objectPosition: doctor.photo.position }}
              />
            </div>
            <div className="absolute -bottom-5 -right-3 max-w-[15rem] rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:-right-6">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">{doctor.role}</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{doctor.name}</p>
              <p className="mt-0.5 text-sm text-slate-500">{doctor.location}</p>
            </div>
          </div>
        </Reveal>
        )}

        <div className={doctor ? "lg:col-span-7" : ""}>
          <Reveal>
            <SectionHeading eyebrow={content.eyebrow} title={content.title} description={content.description} />
          </Reveal>

          <ul className="mt-10 grid gap-6 sm:grid-cols-3">
            {pillars.map((pillar, index) => (
              <Reveal as="li" key={pillar.title} delay={index * 90}>
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-50 text-accent-600 ring-1 ring-inset ring-accent-100">
                  <pillar.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-slate-900">{pillar.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{pillar.description}</p>
              </Reveal>
            ))}
          </ul>

          <Reveal delay={280} className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Button href={routes.about} variant="secondary" rightIcon={ArrowRight}>
              {content.ctaLabel}
            </Button>
            <DemoNotice text="Doctor biographies are demo content pending verified information." />
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
