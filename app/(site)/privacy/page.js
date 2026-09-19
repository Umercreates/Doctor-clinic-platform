import { PageHeader } from "@/components/layout/PageHeader";
import { LegalContent } from "@/components/layout/LegalContent";
import { buildMetadata } from "@/lib/metadata";
import { routes } from "@/lib/routes";
import { getClinicSettings } from "@/server/services/contentService";

export async function generateMetadata() {
  const clinic = await getClinicSettings();
  return buildMetadata({
    title: "Privacy policy",
    description: `How ${clinic.name} collects, uses, and protects the information you share through this website and its appointment booking tools.`,
    path: routes.privacy,
    siteName: clinic.name,
  });
}

const buildSections = (clinic) => [
  {
    title: "Information we collect",
    body: "When you book an appointment or contact us, we collect the details you provide such as your name, email address, phone number, and any notes you include. We use this information only to arrange and manage your care.",
  },
  {
    title: "How we use your information",
    body: "Your details are used to schedule appointments, respond to enquiries, and communicate about your visits. We do not sell personal information.",
  },
  {
    title: "Data security",
    body: "We take reasonable technical and organizational measures to protect your information. Access is limited to staff who need it to support your care.",
  },
  {
    title: "Your choices",
    body: `You can ask us to update or remove your contact details at any time by contacting the clinic at ${clinic.contact.email}.`,
  },
];

export default async function PrivacyPage() {
  const clinic = await getClinicSettings();
  const sections = buildSections(clinic);
  return (
    <>
      <PageHeader compact eyebrow="Legal" title="Privacy policy" breadcrumbs={[{ label: "Privacy" }]} />
      <LegalContent sections={sections} />
    </>
  );
}
