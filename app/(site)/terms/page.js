import { PageHeader } from "@/components/layout/PageHeader";
import { LegalContent } from "@/components/layout/LegalContent";
import { buildMetadata } from "@/lib/metadata";
import { routes } from "@/lib/routes";
import { getClinicSettings } from "@/server/services/contentService";

export async function generateMetadata() {
  const clinic = await getClinicSettings();
  return buildMetadata({
    title: "Terms of use",
    description: `Terms of use for the ${clinic.name} website and online appointment booking.`,
    path: routes.terms,
    siteName: clinic.name,
  });
}

const buildSections = (clinic) => [
  {
    title: "Use of this website",
    body: "This website provides general information about the practice and lets you request appointments online. Submitting a request does not guarantee a specific time until it is confirmed by the clinic.",
  },
  {
    title: "Not medical advice",
    body: clinic.medicalDisclaimer,
  },
  {
    title: "Emergencies",
    body: clinic.emergencyNotice,
  },
  {
    title: "Changes",
    body: "We may update these terms from time to time. Continued use of the website after changes are posted means you accept the updated terms.",
  },
];

export default async function TermsPage() {
  const clinic = await getClinicSettings();
  const sections = buildSections(clinic);
  return (
    <>
      <PageHeader compact eyebrow="Legal" title="Terms of use" breadcrumbs={[{ label: "Terms" }]} />
      <LegalContent sections={sections} />
    </>
  );
}
