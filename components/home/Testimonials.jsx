import { Quote } from "lucide-react";
import { Section } from "@/components/layout/Section";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";

/**
 * Patient testimonials. Only entries that are published AND have recorded
 * consent reach this component (enforced in the repository). The section is
 * omitted entirely when there are none — nothing is invented.
 */
export function Testimonials({ testimonials = [] }) {
  if (!testimonials.length) return null;

  return (
    <Section tone="white" aria-labelledby="testimonials-heading">
      <Reveal>
        <SectionHeading
          eyebrow="Patient voices"
          title="What patients say about their care"
          description="Shared with permission by patients of the practice."
          align="center"
        />
      </Reveal>
      <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {testimonials.slice(0, 6).map((item, index) => (
          <Reveal as="li" key={item.id} delay={(index % 3) * 90}>
            <figure className="flex h-full flex-col rounded-3xl border border-slate-200/80 bg-white p-6 shadow-soft sm:p-7">
              <Quote className="h-6 w-6 text-brand-300" aria-hidden="true" />
              <blockquote className="mt-4 flex-1 text-[0.95rem] leading-relaxed text-slate-700">
                <p>“{item.quote}”</p>
              </blockquote>
              <figcaption className="mt-5 border-t border-slate-100 pt-4 text-sm">
                <span className="font-semibold text-slate-900">{item.authorName}</span>
                {item.doctorName && <span className="text-slate-500"> · Patient of {item.doctorName}</span>}
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </ul>
    </Section>
  );
}
