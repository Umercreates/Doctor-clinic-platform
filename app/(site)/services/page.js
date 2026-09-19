import { CalendarCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { CtaSection } from "@/components/layout/CtaSection";
import { ServiceGrid } from "@/components/services/ServiceGrid";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { DemoNotice } from "@/components/ui/DemoNotice";
import { buildMetadata } from "@/lib/metadata";
import { routes } from "@/lib/routes";
import { appointmentProcess } from "@/data/clinic";
import { getClinicSettings, getPublicDoctors, getPublicServices } from "@/server/services/contentService";

export async function generateMetadata() {
  const [clinic, services] = await Promise.all([getClinicSettings(), getPublicServices()]);
  const names = services.slice(0, 6).map((svc) => svc.name.toLowerCase());
  const list = names.length ? `: ${names.join(", ")}` : "";
  return buildMetadata({
    title: "Services",
    description: `General medical services at ${clinic.name} in ${clinic.city}${list}. Book online in a few simple steps.`,
    path: routes.services,
    siteName: clinic.name,
  });
}

export default async function ServicesPage() {
  const [services, doctors] = await Promise.all([getPublicServices(), getPublicDoctors()]);

  return (
    <>
      <PageHeader
        eyebrow="Services"
        title="General medical care, delivered thoughtfully"
        description="Everyday care for you and your family. Each service page explains what to expect and which doctors you can book with."
        breadcrumbs={[{ label: "Services" }]}
        actions={
          <Button href={routes.appointments} size="lg" leftIcon={CalendarCheck}>
            Book Appointment
          </Button>
        }
      />

      <Section tone="white" aria-labelledby="service-list-heading">
        <h2 id="service-list-heading" className="sr-only">
          Our services
        </h2>
        <ServiceGrid services={services} doctors={doctors} />
        <DemoNotice className="mt-8" text="Service descriptions are general demo content and should be reviewed by the practice before launch." />
      </Section>

      <Section tone="muted" aria-labelledby="visit-heading">
        <Reveal>
          <SectionHeading
            eyebrow="Booking"
            title="How a visit is arranged"
            description="Booking online takes a few minutes and you can choose any doctor who offers the service."
            align="center"
          />
        </Reveal>
        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {appointmentProcess.map((step, index) => (
            <Reveal as="li" key={step.step} delay={index * 60} className="flex gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-950 text-sm font-bold text-white">
                {step.step}
              </span>
              <div>
                <h3 className="font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{step.description}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </Section>

      <CtaSection />
    </>
  );
}
