import { Section } from "./Section";
import { DemoNotice } from "@/components/ui/DemoNotice";

/**
 * Simple long-form layout for legal pages. Content is demo text and must be
 * reviewed by the practice before launch.
 */
export function LegalContent({ sections = [], updated = "Demo draft" }) {
  return (
    <Section tone="white" containerSize="narrow">
      <p className="text-sm text-slate-500">Last updated: {updated}</p>
      <div className="mt-8 space-y-10">
        {sections.map((section) => (
          <section key={section.title} aria-labelledby={section.title}>
            <h2 id={section.title} className="text-xl font-semibold text-slate-900 sm:text-2xl">
              {section.title}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-slate-600">{section.body}</p>
          </section>
        ))}
      </div>
      <DemoNotice className="mt-12" text="This is demo legal text for layout purposes only. Replace with policies reviewed by the practice and its legal advisors." />
    </Section>
  );
}
