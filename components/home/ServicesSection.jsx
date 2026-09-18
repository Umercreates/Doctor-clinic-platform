import { ArrowRight } from "lucide-react";
import { Section } from "@/components/layout/Section";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { ServiceGrid } from "@/components/services/ServiceGrid";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { routes } from "@/lib/routes";

export function ServicesSection({ services, doctors }) {
  return (
    <Section tone="muted" aria-labelledby="services-heading">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <Reveal>
          <SectionHeading
            eyebrow="Services"
            title="General medical care for every stage of life"
            description="From first consultations to ongoing follow-up, our services cover the everyday needs of you and your family."
          />
        </Reveal>
        <Reveal delay={120} className="shrink-0">
          <Button href={routes.services} variant="secondary" rightIcon={ArrowRight}>
            View all services
          </Button>
        </Reveal>
      </div>
      <div className="mt-12">
        <ServiceGrid services={services} doctors={doctors} />
      </div>
    </Section>
  );
}
