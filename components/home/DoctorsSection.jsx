import { ArrowRight } from "lucide-react";
import { Section } from "@/components/layout/Section";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { DoctorGrid } from "@/components/doctors/DoctorGrid";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { DemoNotice } from "@/components/ui/DemoNotice";
import { routes } from "@/lib/routes";

export function DoctorsSection({ doctors }) {
  return (
    <Section tone="white" aria-labelledby="doctors-heading">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <Reveal>
          <SectionHeading
            eyebrow="Our doctors"
            title="Meet the team who will look after you"
            description="Choose the doctor you would like to see. Each profile shows areas of care and typical availability."
          />
        </Reveal>
        <Reveal delay={120} className="shrink-0">
          <Button href={routes.doctors} variant="secondary" rightIcon={ArrowRight}>
            All doctors
          </Button>
        </Reveal>
      </div>
      <div className="mt-12">
        <DoctorGrid doctors={doctors} />
      </div>
      <DemoNotice className="mt-6" text="Roles marked (demo) and biographies are placeholders pending verified information." />
    </Section>
  );
}
