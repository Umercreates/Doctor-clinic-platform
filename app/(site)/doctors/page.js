import { CalendarCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { CtaSection } from "@/components/layout/CtaSection";
import { DoctorGrid } from "@/components/doctors/DoctorGrid";
import { Button } from "@/components/ui/Button";
import { DemoNotice } from "@/components/ui/DemoNotice";
import { buildMetadata } from "@/lib/metadata";
import { routes } from "@/lib/routes";
import { clinic } from "@/data/clinic";
import { listDoctors } from "@/server/repositories/doctorsRepository";

export const metadata = buildMetadata({
  title: "Our doctors",
  description: `Meet Dr. Williams, Dr. Jones, and Dr. Jennifer, the medical team at ${clinic.name} in ${clinic.city}, ${clinic.stateFull}. View profiles and book an appointment online.`,
  path: routes.doctors,
});

export default async function DoctorsPage() {
  const doctors = await listDoctors();

  return (
    <>
      <PageHeader
        eyebrow="Doctors"
        title="Meet our medical team"
        description={`Choose the doctor you would like to see. Each profile lists areas of care, a short introduction, and typical availability at our ${clinic.city} clinic.`}
        breadcrumbs={[{ label: "Doctors" }]}
        actions={
          <Button href={routes.appointments} size="lg" leftIcon={CalendarCheck}>
            Book Appointment
          </Button>
        }
      />

      <Section tone="white" aria-label="Doctor profiles">
        <DoctorGrid doctors={doctors} />
        <DemoNotice
          className="mt-8"
          text="Roles marked (demo), biographies, and areas of care are placeholder content pending verified information."
        />
      </Section>

      <CtaSection
        eyebrow="Not sure who to see?"
        title="Start with a general consultation"
        description="Any of our doctors can help with a first visit. Choose whoever has availability that suits you."
      />
    </>
  );
}
