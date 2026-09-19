import { ArrowRight, Clock, Siren } from "lucide-react";
import { Section } from "@/components/layout/Section";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { DemoNotice } from "@/components/ui/DemoNotice";
import { ContactDetails } from "@/components/contact/ContactDetails";
import { OpeningHours } from "@/components/contact/OpeningHours";
import { DEMO_CLINIC_NOTICE } from "@/data/clinic";
import { routes } from "@/lib/routes";

/** Homepage "visit us" block driven by website settings. */
export function ClinicInfo({ clinic }) {
  return (
    <Section tone="muted" aria-labelledby="clinic-heading">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <Reveal>
            <SectionHeading
              eyebrow="Visit us"
              title={`Located in ${clinic.city}, ${clinic.stateFull}`}
              description="A calm, modern clinic that is easy to reach. Find our address, opening hours, and contact details below."
            />
            <Button href={routes.contact} variant="secondary" rightIcon={ArrowRight} className="mt-8">
              Contact & directions
            </Button>
          </Reveal>
          <Reveal delay={120} className="mt-8 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <Siren className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
            <p>{clinic.emergencyNotice}</p>
          </Reveal>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:col-span-7">
          <Reveal delay={80} className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-soft sm:p-7">
            <h3 className="text-base font-semibold text-slate-900">Clinic details</h3>
            <ContactDetails clinic={clinic} className="mt-5" />
            {(clinic.address?.isDemo || clinic.contact?.isDemo) && <DemoNotice text={DEMO_CLINIC_NOTICE} className="mt-6" />}
          </Reveal>
          <Reveal delay={160} className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-soft sm:p-7">
            <h3 className="inline-flex items-center gap-2 text-base font-semibold text-slate-900">
              <Clock className="h-4.5 w-4.5 text-brand-600" aria-hidden="true" />
              Opening hours
            </h3>
            <OpeningHours clinic={clinic} className="mt-3" />
            {clinic.hours?.isDemo && <DemoNotice text="Demo opening hours — replace with verified schedule." className="mt-4" />}
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
