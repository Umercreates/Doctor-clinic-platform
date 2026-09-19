/**
 * FAQ repository — PostgreSQL implementation.
 */
import { query, queryOne, queryRows } from "@/lib/database";
import { faqCategories } from "@/data/faqs";
import { toFaq } from "./mappers";

export async function listFaqs({ featuredOnly = false, includeInactive = false } = {}) {
  const where = [];
  if (!includeInactive) where.push("is_active");
  if (featuredOnly) where.push("featured");
  const rows = await queryRows(`SELECT * FROM faqs ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY sort_order, question`);
  return rows.map(toFaq);
}

export async function listFaqCategories() {
  return faqCategories;
}

export async function getFaqById(id) {
  const row = await queryOne("SELECT * FROM faqs WHERE id = $1", [id]);
  return row ? toFaq(row) : null;
}

export async function getFaqByKey(key) {
  const row = await queryOne("SELECT * FROM faqs WHERE key = $1", [key]);
  return row ? toFaq(row) : null;
}

const WRITABLE = { key: "key", category: "category", question: "question", answer: "answer", featured: "featured", sortOrder: "sort_order", isActive: "is_active" };

function pick(input) {
  const columns = [];
  const values = [];
  for (const [k, column] of Object.entries(WRITABLE)) {
    if (input[k] !== undefined) {
      columns.push(column);
      values.push(input[k]);
    }
  }
  return { columns, values };
}

export async function createFaq(input) {
  const { columns, values } = pick(input);
  const row = await queryOne(`INSERT INTO faqs (${columns.join(", ")}) VALUES (${values.map((_, i) => `$${i + 1}`).join(", ")}) RETURNING id`, values);
  return getFaqById(row.id);
}

export async function updateFaq(id, patch) {
  const { columns, values } = pick(patch);
  if (columns.length) await query(`UPDATE faqs SET ${columns.map((c, i) => `${c} = $${i + 2}`).join(", ")} WHERE id = $1`, [id, ...values]);
  return getFaqById(id);
}

/** FAQs have no dependants, so hard deletion is safe. */
export async function deleteFaq(id) {
  const { rowCount } = await query("DELETE FROM faqs WHERE id = $1", [id]);
  return rowCount > 0;
}
