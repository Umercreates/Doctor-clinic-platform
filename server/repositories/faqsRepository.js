/**
 * FAQ repository (demo-data backed; swapped for PostgreSQL later).
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
