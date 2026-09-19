import { CalendarCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { CtaSection } from "@/components/layout/CtaSection";
import { DoctorGrid } from "@/components/doctors/DoctorGrid";
import { Button } from "@/components/ui/Button";
import { DemoNotice } from "@/components/ui/DemoNotice";
import { buildMetadata } from "@/lib/metadata";
import { routes } from "@/lib/routes";
import { getClinicSettings, getPublicDoctors } from "@/server/services/contentService";

export async function generateMetadata() {
  const [clinic, doctors] = await Promise.all([getClinicSettings(), getPublicDoctors()]);
  const names = doctors.map((d) => d.name);
  const team = names.length ? `Meet ${names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names.at(-1)}` : names[0]}, the medical team` : "Meet the medical team";
  return buildMetadata({
    title: "Our doctors",
    description: `${team} at ${clinic.name} in ${clinic.city}, ${clinic.stateFull}. View profiles and book an appointment online.`,
    path: routes.doctors,
    siteName: clinic.name,
  });
}

export default async function DoctorsPage() {
  const [clinic, doctors] = await Promise.all([getClinicSettings(), getPublicDoctors()]);

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

      <Section tone="white" aria-labelledby="doctor-profiles-heading">
        <h2 id="doctor-profiles-heading" className="sr-only">
          Doctor profiles
        </h2>
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
