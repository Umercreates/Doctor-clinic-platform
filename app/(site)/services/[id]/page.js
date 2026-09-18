import { notFound } from "next/navigation";
import { CalendarCheck, Check, Clock, MessageCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { CtaSection } from "@/components/layout/CtaSection";
import { DoctorGrid } from "@/components/doctors/DoctorGrid";
import { JsonLd } from "@/components/seo/JsonLd";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { DemoNotice } from "@/components/ui/DemoNotice";
import { buildMetadata } from "@/lib/metadata";
import { buildBreadcrumbJsonLd } from "@/lib/seo";
import { routes } from "@/lib/routes";
import { clinic } from "@/data/clinic";
import { getServiceBySlug, listServices } from "@/server/repositories/servicesRepository";
import { listDoctorsByService } from "@/server/repositories/doctorsRepository";

/**
 * Every published service is pre-rendered from the catalogue; unknown slugs return
 * a real 404 at the router. When profiles come from PostgreSQL (backend phase),
 * switch to `dynamicParams = true` with `revalidate` or on-demand revalidation.
 */
export const dynamicParams = false;

export async function generateStaticParams() {
  const services = await listServices();
  return services.map((service) => ({ id: service.slug }));
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const service = await getServiceBySlug(id);
  if (!service) notFound();
  return buildMetadata({
    title: service.name,
    description: `${service.shortDescription} Book ${service.name.toLowerCase()} at ${clinic.name} in ${clinic.city}, ${clinic.stateFull}.`,
    path: routes.service(service.slug),
  });
}

export default async function ServicePage({ params }) {
  const { id } = await params;
  const service = await getServiceBySlug(id);
  if (!service) notFound();

  const doctors = await listDoctorsByService(service.id);
  const bookHref = routes.bookWith({ service: service.slug });

  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { label: "Services", href: routes.services },
          { label: service.name, href: routes.service(service.slug) },
        ])}
      />
      <PageHeader
        eyebrow="Service"
        title={service.name}
        description={service.shortDescription}
        breadcrumbs={[{ label: "Services", href: routes.services }, { label: service.name }]}
        actions={
          <>
            <Button href={bookHref} size="lg" leftIcon={CalendarCheck}>
              Book this service
            </Button>
            <Button href={routes.contact} variant="secondary" size="lg" leftIcon={MessageCircle}>
              Ask a question
            </Button>
          </>
        }
      />

      <Section tone="white" aria-label={`About ${service.name}`}>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-8">
            <Reveal>
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100">
                <Icon name={service.icon} className="h-6 w-6" />
              </span>
              <h2 className="mt-6 text-2xl font-bold text-slate-900 sm:text-3xl">General information</h2>
              <div className="mt-5 space-y-4 text-base leading-relaxed text-slate-600">
                {service.description.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              {service.isDemo && (
                <DemoNotice className="mt-4" text="Service description is general demo content pending review by the practice." />
              )}
            </Reveal>

            <Reveal as="section" aria-labelledby="what-to-expect" className="mt-12">
              <h2 id="what-to-expect" className="text-2xl font-bold text-slate-900 sm:text-3xl">
                What to expect
              </h2>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {service.highlights.map((item) => (
                  <li key={item} className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-soft">
                    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-50 text-accent-600 ring-1 ring-inset ring-accent-100">
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                    <span className="text-[0.95rem] text-slate-800">{item}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          <aside className="lg:col-span-4" aria-label="Service summary">
            <Reveal delay={120} className="lg:sticky lg:top-28">
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-slate-900">At a glance</h2>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <dt className="inline-flex items-center gap-2 text-slate-600">
                      <Clock className="h-4 w-4 text-brand-600" aria-hidden="true" />
                      Duration
                    </dt>
                    <dd className="font-medium text-slate-900">{service.durationMinutes} minutes</dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-slate-600">Available with</dt>
                    <dd className="text-right font-medium text-slate-900">
                      {doctors.map((doctor) => (
                        <span key={doctor.id} className="block">
                          {doctor.name}
                        </span>
                      ))}
                    </dd>
                  </div>
                </dl>
                <Button href={bookHref} fullWidth size="lg" leftIcon={CalendarCheck} className="mt-6">
                  Book Appointment
                </Button>
              </Card>
            </Reveal>
          </aside>
        </div>
      </Section>

      <Section tone="muted" aria-labelledby="related-doctors">
        <Reveal>
          <SectionHeading eyebrow="Doctors" title={`Doctors who offer ${service.name.toLowerCase()}`} />
        </Reveal>
        <div className="mt-10">
          <DoctorGrid doctors={doctors} variant="compact" />
        </div>
      </Section>

      <CtaSection title={`Ready to book ${service.name.toLowerCase()}?`} primaryHref={bookHref} />
    </>
  );
}
