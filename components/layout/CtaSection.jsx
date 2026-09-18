import { CalendarCheck, Phone } from "lucide-react";
import { Section } from "./Section";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { routes } from "@/lib/routes";
import { clinic } from "@/data/clinic";

/**
 * Final call-to-action band used at the bottom of most public pages.
 */
export function CtaSection({
  eyebrow = "Ready when you are",
  title = "Book your appointment today",
  description = "Choose a doctor, pick a time that suits you, and we will take care of the rest. Same-week availability for most visits.",
  primaryLabel = "Book Appointment",
  primaryHref = routes.appointments,
}) {
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
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-300">{eyebrow}</p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">{title}</h2>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">{description}</p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Button href={primaryHref} variant="inverse" size="lg" leftIcon={CalendarCheck}>
            {primaryLabel}
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
