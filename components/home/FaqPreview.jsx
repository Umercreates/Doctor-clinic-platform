import { ArrowRight, MessageCircle } from "lucide-react";
import { Section } from "@/components/layout/Section";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { Accordion } from "@/components/faq/Accordion";
import { routes } from "@/lib/routes";

/** Homepage FAQ preview (featured, active FAQs). Hidden when there are none. */
export function FaqPreview({ faqs }) {
  if (!faqs?.length) return null;
  return (
    <Section tone="white" aria-labelledby="faq-heading">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-4">
          <Reveal className="lg:sticky lg:top-28">
            <SectionHeading
              eyebrow="FAQ"
              title="Questions patients often ask"
              description="Quick answers about booking, visits, and how to reach us. Can't find what you need? We are happy to help."
            />
            <div className="mt-8 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
              <Button href={routes.faq} variant="secondary" rightIcon={ArrowRight}>
                All FAQs
              </Button>
              <Button href={routes.contact} variant="ghost" leftIcon={MessageCircle}>
                Ask a question
              </Button>
            </div>
          </Reveal>
        </div>
        <Reveal delay={100} className="lg:col-span-8">
          <Accordion items={faqs} defaultOpen={faqs[0] ? [faqs[0].id] : []} />
        </Reveal>
      </div>
    </Section>
  );
}
