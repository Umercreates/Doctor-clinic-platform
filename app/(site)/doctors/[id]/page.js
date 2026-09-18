import { notFound } from "next/navigation";
import { DoctorProfile } from "@/components/doctors/DoctorProfile";
import { DoctorGrid } from "@/components/doctors/DoctorGrid";
import { Section } from "@/components/layout/Section";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { CtaSection } from "@/components/layout/CtaSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { Reveal } from "@/components/ui/Reveal";
import { buildMetadata } from "@/lib/metadata";
import { buildBreadcrumbJsonLd, buildDoctorJsonLd } from "@/lib/seo";
import { routes } from "@/lib/routes";
import { clinic } from "@/data/clinic";
import { getDoctorBySlug, listDoctors } from "@/server/repositories/doctorsRepository";
import { listServicesForDoctor } from "@/server/repositories/servicesRepository";

/** Pre-render every published doctor profile. */
/**
 * Every published doctor is pre-rendered from the catalogue; unknown slugs return
 * a real 404 at the router. When profiles come from PostgreSQL (backend phase),
 * switch to `dynamicParams = true` with `revalidate` or on-demand revalidation.
 */
export const dynamicParams = false;

export async function generateStaticParams() {
  const doctors = await listDoctors();
  return doctors.map((doctor) => ({ id: doctor.slug }));
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const doctor = await getDoctorBySlug(id);
  if (!doctor) notFound();
  return buildMetadata({
    title: `${doctor.name} - ${doctor.role}`,
    description: `${doctor.shortBio} Book an appointment with ${doctor.name} at ${clinic.name} in ${clinic.city}, ${clinic.stateFull}.`,
    path: routes.doctor(doctor.slug),
    image: doctor.photo.src,
    type: "profile",
  });
}

export default async function DoctorPage({ params }) {
  const { id } = await params;
  const doctor = await getDoctorBySlug(id);
  if (!doctor) notFound();

  const [services, allDoctors] = await Promise.all([listServicesForDoctor(doctor.id), listDoctors()]);
  const otherDoctors = allDoctors.filter((d) => d.id !== doctor.id);

  return (
    <>
      <JsonLd data={buildDoctorJsonLd(doctor)} />
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { label: "Doctors", href: routes.doctors },
          { label: doctor.name, href: routes.doctor(doctor.slug) },
        ])}
      />
      <DoctorProfile doctor={doctor} services={services} />

      {otherDoctors.length > 0 && (
        <Section tone="muted" aria-labelledby="other-doctors">
          <Reveal>
            <SectionHeading eyebrow="Our team" title="Other doctors at the practice" />
          </Reveal>
          <div className="mt-10">
            <DoctorGrid doctors={otherDoctors} variant="compact" className="lg:grid-cols-2 xl:grid-cols-3" />
          </div>
        </Section>
      )}

      <CtaSection
        title={`Book an appointment with ${doctor.name}`}
        description="Choose a service and a time that suits you. You will receive a confirmation reference right away."
        primaryHref={routes.bookWith({ doctor: doctor.slug })}
      />
    </>
  );
}
