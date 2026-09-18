/**
 * FAQ repository — demo-data implementation.
 */
import { faqs, faqCategories } from "@/data/faqs";

export async function listFaqs({ featuredOnly = false } = {}) {
  return faqs
    .filter((f) => !featuredOnly || f.featured)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function listFaqCategories() {
  return faqCategories;
}
