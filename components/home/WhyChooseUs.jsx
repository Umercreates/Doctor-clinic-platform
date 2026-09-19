import { Section } from "@/components/layout/Section";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { Icon } from "@/components/ui/Icon";

/** Homepage "why our practice" grid; copy from the `home.why` content block. */
export function WhyChooseUs({ content }) {
  const items = content.items || [];
  if (!items.length) return null;

  return (
    <Section tone="subtle" aria-labelledby="why-heading" className="overflow-hidden">
      <Reveal>
        <SectionHeading eyebrow={content.eyebrow} title={content.title} description={content.description} align="center" />
      </Reveal>
      <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => (
          <Reveal as="li" key={`${index}-${item.title}`} delay={(index % 3) * 90}>
            <div className="group h-full rounded-3xl border border-slate-200/80 bg-white p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lift sm:p-7">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100 transition-colors duration-300 group-hover:bg-brand-600 group-hover:text-white">
                <Icon name={item.icon || "check"} className="h-5.5 w-5.5" />
              </span>
              <h3 className="mt-5 text-lg font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-slate-600">{item.description}</p>
            </div>
          </Reveal>
        ))}
      </ul>
    </Section>
  );
}
