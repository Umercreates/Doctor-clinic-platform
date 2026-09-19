import { CalendarCheck, Clock, Siren } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { CtaSection } from "@/components/layout/CtaSection";
import { ContactForm } from "@/components/contact/ContactForm";
import { ContactDetails } from "@/components/contact/ContactDetails";
import { OpeningHours } from "@/components/contact/OpeningHours";
import { MapSection } from "@/components/contact/MapSection";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DemoNotice } from "@/components/ui/DemoNotice";
import { buildMetadata } from "@/lib/metadata";
import { routes } from "@/lib/routes";
import { DEMO_CLINIC_NOTICE } from "@/data/clinic";
import { getClinicSettings } from "@/server/services/contentService";

export async function generateMetadata() {
  const clinic = await getClinicSettings();
  return buildMetadata({
    title: "Contact",
    description: `Contact ${clinic.name} in ${clinic.city}, ${clinic.stateFull}. Phone, email, address, opening hours, and a contact form for non-urgent questions.`,
    path: routes.contact,
    siteName: clinic.name,
  });
}

export default async function ContactPage() {
  const clinic = await getClinicSettings();
  const detailsAreDemo = Boolean(clinic.address?.isDemo || clinic.contact?.isDemo);
  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="We are here to help"
        description="Questions about appointments, your visit, or the practice? Send us a message or reach us by phone during opening hours."
        breadcrumbs={[{ label: "Contact" }]}
        actions={
          <Button href={routes.appointments} size="lg" leftIcon={CalendarCheck}>
            Book Appointment
          </Button>
        }
      />

      <Section tone="white" aria-label="Contact details and form">
        <Reveal className="mb-10 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="note">
          <Siren className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
          <p>
            <span className="font-semibold">Emergency notice: </span>
            {clinic.emergencyNotice}
          </p>
        </Reveal>

        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="space-y-6 lg:col-span-5">
            <Reveal>
              <Card className="p-6 sm:p-7">
                <h2 className="text-lg font-semibold text-slate-900">Clinic information</h2>
                <ContactDetails clinic={clinic} className="mt-5" showFax />
                {detailsAreDemo && <DemoNotice text={DEMO_CLINIC_NOTICE} className="mt-6" />}
              </Card>
            </Reveal>
            <Reveal delay={100}>
              <Card className="p-6 sm:p-7">
                <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-slate-900">
                  <Clock className="h-4.5 w-4.5 text-brand-600" aria-hidden="true" />
                  Opening hours
                </h2>
                <OpeningHours clinic={clinic} className="mt-3" />
                {clinic.hours?.isDemo && <DemoNotice text="Demo opening hours — replace with verified schedule." className="mt-4" />}
              </Card>
            </Reveal>
          </div>

          <div className="lg:col-span-7">
            <Reveal delay={140}>
              <Card className="p-6 sm:p-8">
                <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Send us a message</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  For non-urgent questions. We typically respond within one business day.
                </p>
                <div className="mt-7">
                  <ContactForm clinic={clinic} />
                </div>
              </Card>
            </Reveal>
          </div>
        </div>
      </Section>

      <Section tone="muted" padding="compact" aria-label="Map">
        <Reveal>
          <MapSection clinic={clinic} />
        </Reveal>
      </Section>

      <CtaSection
        eyebrow="Prefer to book online?"
        title="Book your appointment in a few clicks"
        description="Choose a doctor and time that suits you. It only takes a couple of minutes."
      />
    </>
  );
}
