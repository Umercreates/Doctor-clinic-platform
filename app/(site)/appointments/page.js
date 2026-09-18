import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { AppointmentWizard } from "@/components/appointments/AppointmentWizard";
import { DemoNotice } from "@/components/ui/DemoNotice";
import { buildMetadata } from "@/lib/metadata";
import { routes } from "@/lib/routes";
import { clinic } from "@/data/clinic";
import { listDoctors } from "@/server/repositories/doctorsRepository";
import { listServices } from "@/server/repositories/servicesRepository";

export const metadata = buildMetadata({
  title: "Book an appointment",
  description: `Book an appointment online with ${clinic.name} in ${clinic.city}, ${clinic.stateFull}. Choose your doctor, service, date and time in a few simple steps.`,
  path: routes.appointments,
});

/**
 * Booking page. Reads optional prefills from the URL (?doctor=slug&service=slug)
 * and hands the doctor/service catalogue to the client-side wizard.
 */
export default async function AppointmentsPage({ searchParams }) {
  const [{ doctor: initialDoctor, service: initialService }, doctors, services] = await Promise.all([
    searchParams,
    listDoctors(),
    listServices(),
  ]);

  return (
    <>
      <PageHeader
        compact
        eyebrow="Appointments"
        title="Book an appointment"
        description="Choose a doctor, pick a time that suits you, and tell us a little about yourself. It only takes a couple of minutes."
        breadcrumbs={[{ label: "Appointments" }]}
      />

      <Section tone="muted" padding="compact" aria-label="Appointment booking">
        <AppointmentWizard
          doctors={doctors}
          services={services}
          initialDoctor={typeof initialDoctor === "string" ? initialDoctor : null}
          initialService={typeof initialService === "string" ? initialService : null}
        />
        <DemoNotice className="mt-8" text="Availability shown is generated from demo schedules. Live scheduling is connected in a later phase." />
      </Section>
    </>
  );
}
