/**
 * Testimonials repository — PostgreSQL implementation.
 * Public reads return only rows that are published AND have recorded consent.
 */
import { query, queryOne, queryRows } from "@/lib/database";

function toTestimonial(row) {
  return {
    id: row.id,
    authorName: row.author_name,
    quote: row.quote,
    doctorId: row.doctor_id,
    doctorName: row.doctor_name || null,
    rating: row.rating,
    isPublished: row.is_published,
    consentGiven: row.consent_given,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const SELECT = "SELECT t.*, d.name AS doctor_name FROM testimonials t LEFT JOIN doctors d ON d.id = t.doctor_id";

export async function listTestimonials({ publicOnly = true } = {}) {
  const rows = await queryRows(`${SELECT} ${publicOnly ? "WHERE t.is_published AND t.consent_given" : ""} ORDER BY t.sort_order, t.created_at DESC`);
  return rows.map(toTestimonial);
}

export async function getTestimonialById(id) {
  const row = await queryOne(`${SELECT} WHERE t.id = $1`, [id]);
  return row ? toTestimonial(row) : null;
}

const WRITABLE = { authorName: "author_name", quote: "quote", doctorId: "doctor_id", rating: "rating", isPublished: "is_published", consentGiven: "consent_given", sortOrder: "sort_order" };

function pick(input) {
  const columns = [];
  const values = [];
  for (const [key, column] of Object.entries(WRITABLE)) {
    if (input[key] !== undefined) {
      columns.push(column);
      values.push(input[key]);
    }
  }
  return { columns, values };
}

export async function createTestimonial(input) {
  const { columns, values } = pick(input);
  const row = await queryOne(`INSERT INTO testimonials (${columns.join(", ")}) VALUES (${values.map((_, i) => `$${i + 1}`).join(", ")}) RETURNING id`, values);
  return getTestimonialById(row.id);
}

export async function updateTestimonial(id, patch) {
  const { columns, values } = pick(patch);
  if (columns.length) await query(`UPDATE testimonials SET ${columns.map((c, i) => `${c} = $${i + 2}`).join(", ")} WHERE id = $1`, [id, ...values]);
  return getTestimonialById(id);
}

export async function deleteTestimonial(id) {
  const { rowCount } = await query("DELETE FROM testimonials WHERE id = $1", [id]);
  return rowCount > 0;
}
