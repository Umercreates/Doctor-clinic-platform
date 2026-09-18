import { Accordion } from "./Accordion";

/**
 * Groups FAQs by category (when categories are supplied) and renders an
 * accordion per group. Server component: content is in the HTML for SEO.
 */
export function FaqList({ faqs = [], categories = [], defaultOpenFirst = true }) {
  if (!categories.length) {
    return <Accordion items={faqs} defaultOpen={defaultOpenFirst && faqs[0] ? [faqs[0].id] : []} />;
  }

  return (
    <div className="space-y-10">
      {categories.map((category, index) => {
        const items = faqs.filter((f) => f.category === category.id);
        if (!items.length) return null;
        return (
          <section key={category.id} aria-labelledby={`faq-${category.id}`}>
            <h2 id={`faq-${category.id}`} className="mb-4 text-lg font-semibold text-slate-900 sm:text-xl">
              {category.label}
            </h2>
            <Accordion items={items} defaultOpen={defaultOpenFirst && index === 0 ? [items[0].id] : []} />
          </section>
        );
      })}
    </div>
  );
}
