/**
 * FAQ repository — demo-data implementation.
 */
import { faqs, faqCategories } from "@/data/faqs";
import { notAvailable } from "./notAvailable";

export async function listFaqs({ featuredOnly = false } = {}) {
  return faqs.filter((f) => !featuredOnly || f.featured).sort((a, b) => a.sortOrder - b.sortOrder).map((f) => ({ ...f, uuid: f.id, isActive: true }));
}

export async function listFaqCategories() {
  return faqCategories;
}

export async function getFaqById(id) {
  return faqs.find((f) => f.id === id) || null;
}

export const getFaqByKey = getFaqById;
export const createFaq = notAvailable;
export const updateFaq = notAvailable;
export const deleteFaq = notAvailable;
