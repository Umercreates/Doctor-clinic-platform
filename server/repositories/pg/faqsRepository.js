/**
 * FAQ repository — PostgreSQL implementation. Categories stay in data/faqs.js
 * (presentation labels) until content management arrives in the dashboard phase.
 */
import { queryRows } from "@/lib/database";
import { faqCategories } from "@/data/faqs";
import { toFaq } from "./mappers";

export async function listFaqs({ featuredOnly = false } = {}) {
  const rows = await queryRows(
    `SELECT * FROM faqs WHERE is_active ${featuredOnly ? "AND featured" : ""} ORDER BY sort_order, question`,
  );
  return rows.map(toFaq);
}

export async function listFaqCategories() {
  return faqCategories;
}
