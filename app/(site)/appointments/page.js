import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { AppointmentWizard } from "@/components/appointments/AppointmentWizard";
import { buildMetadata } from "@/lib/metadata";
import { routes } from "@/lib/routes";
import { getBookingRules, getClinicSettings, getPublicDoctors, getPublicServices } from "@/server/services/contentService";

export async function generateMetadata() {
  const clinic = await getClinicSettings();
  return buildMetadata({
    title: "Book an appointment",
    description: `Book an appointment online with ${clinic.name} in ${clinic.city}, ${clinic.stateFull}. Choose your doctor, service, date and time in a few simple steps.`,
    path: routes.appointments,
    siteName: clinic.name,
  });
}

/**
 * Booking page. Reads optional prefills from the URL (?doctor=slug&service=slug)
 * and hands the doctor/service catalogue to the client-side wizard.
 */
export default async function AppointmentsPage({ searchParams }) {
  const [{ doctor: initialDoctor, service: initialService }, doctors, services, bookingRules, clinic] = await Promise.all([
    searchParams,
    getPublicDoctors(),
    getPublicServices(),
    getBookingRules(),
    getClinicSettings(),
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
          bookingRules={bookingRules}
          clinic={{ name: clinic.name, contact: clinic.contact, address: clinic.address, emergencyNotice: clinic.emergencyNotice }}
        />
      </Section>
    </>
  );
}
