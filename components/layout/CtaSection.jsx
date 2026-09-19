import { CalendarCheck, Phone } from "lucide-react";
import { Section } from "./Section";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { routes } from "@/lib/routes";
import { getClinicSettings, getContentBlock } from "@/server/services/contentService";

/**
 * Final call-to-action band used at the bottom of most public pages.
 * Defaults come from the `home.cta` content block; pages may override the copy.
 * Reads are per-request cached, so this adds no extra queries.
 */
export async function CtaSection({ eyebrow, title, description, primaryLabel, primaryHref = routes.appointments }) {
  const [clinic, block] = await Promise.all([getClinicSettings(), getContentBlock("home.cta")]);
  const copy = {
    eyebrow: eyebrow ?? block?.eyebrow,
    title: title ?? block?.title,
    description: description ?? block?.description,
    primaryLabel: primaryLabel ?? block?.primaryCta ?? "Book Appointment",
  };
  return (
    <Section tone="dark" padding="large" className="overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-accent-400/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-brand-400/20 blur-3xl"
      />
      <Reveal className="relative mx-auto max-w-3xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-300">{copy.eyebrow}</p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">{copy.title}</h2>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">{copy.description}</p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Button href={primaryHref} variant="inverse" size="lg" leftIcon={CalendarCheck}>
            {copy.primaryLabel}
          </Button>
          <Button href={clinic.contact.phoneHref} variant="ghost-light" size="lg" leftIcon={Phone}>
            Call {clinic.contact.phone}
          </Button>
        </div>
        <p className="mt-6 text-xs text-white/50">{clinic.emergencyNotice}</p>
      </Reveal>
    </Section>
  );
}
