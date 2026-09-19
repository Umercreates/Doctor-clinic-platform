import { MessageCircle, Phone } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { CtaSection } from "@/components/layout/CtaSection";
import { FaqList } from "@/components/faq/FaqList";
import { JsonLd } from "@/components/seo/JsonLd";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { buildMetadata } from "@/lib/metadata";
import { buildFaqJsonLd } from "@/lib/seo";
import { routes } from "@/lib/routes";
import { listFaqs, listFaqCategories } from "@/server/repositories/faqsRepository";
import { getClinicSettings } from "@/server/services/contentService";

export async function generateMetadata() {
  const clinic = await getClinicSettings();
  return buildMetadata({
    title: "Frequently asked questions",
    description: `Answers to common questions about booking, visits, and contacting ${clinic.name} in ${clinic.city}. Learn how to book, reschedule, and what to bring.`,
    path: routes.faq,
    siteName: clinic.name,
  });
}

export default async function FaqPage() {
  const [clinic, faqs, categories] = await Promise.all([getClinicSettings(), listFaqs(), listFaqCategories()]);

  return (
    <>
      {faqs.length > 0 && <JsonLd data={buildFaqJsonLd(faqs)} />}
      <PageHeader
        eyebrow="FAQ"
        title="Frequently asked questions"
        description="Everything you need to know about booking an appointment, preparing for your visit, and getting in touch."
        breadcrumbs={[{ label: "FAQ" }]}
      />

      <Section tone="white" aria-label="Questions and answers">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-8">
            <Reveal>
              {faqs.length ? (
                <FaqList faqs={faqs} categories={categories} />
              ) : (
                <EmptyState
                  title="No questions published yet"
                  description="The practice has not published any answers yet. Please contact the clinic and we will be glad to help."
                />
              )}
            </Reveal>
          </div>
          <aside className="lg:col-span-4" aria-label="Still have questions">
            <Reveal delay={120} className="lg:sticky lg:top-28">
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-slate-900">Still have a question?</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Our team is happy to help during opening hours. Send us a message or give us a call.
                </p>
                <div className="mt-5 flex flex-col gap-2">
                  <Button href={routes.contact} leftIcon={MessageCircle} fullWidth>
                    Contact the clinic
                  </Button>
                  <Button href={clinic.contact.phoneHref} variant="secondary" leftIcon={Phone} fullWidth>
                    {clinic.contact.phone}
                  </Button>
                </div>
                <p className="mt-4 text-xs leading-relaxed text-slate-500">{clinic.emergencyNotice}</p>
              </Card>
            </Reveal>
          </aside>
        </div>
      </Section>

      <CtaSection />
    </>
  );
}
