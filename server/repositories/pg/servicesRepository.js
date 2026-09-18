/**
 * Services repository — PostgreSQL implementation.
 */
import { query, queryOne, queryRows } from "@/lib/database";
import { toService } from "./mappers";

const SERVICE_SELECT = `
  SELECT s.*,
    COALESCE((SELECT array_agg(ds.doctor_id) FROM doctor_services ds JOIN doctors d ON d.id = ds.doctor_id AND d.is_active WHERE ds.service_id = s.id), '{}') AS doctor_ids
  FROM services s
`;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function listServices({ includeInactive = false } = {}) {
  const rows = await queryRows(`${SERVICE_SELECT} ${includeInactive ? "" : "WHERE s.is_active"} ORDER BY s.sort_order, s.name`);
  return rows.map(toService);
}

export async function getServiceBySlug(slug, { includeInactive = false } = {}) {
  const row = await queryOne(`${SERVICE_SELECT} WHERE s.slug = $1 ${includeInactive ? "" : "AND s.is_active"}`, [slug]);
  return toService(row);
}

export async function getServiceById(id, { includeInactive = false } = {}) {
  if (!UUID_RE.test(String(id))) return null;
  const row = await queryOne(`${SERVICE_SELECT} WHERE s.id = $1 ${includeInactive ? "" : "AND s.is_active"}`, [id]);
  return toService(row);
}

export async function getServiceByIdOrSlug(idOrSlug, options) {
  return UUID_RE.test(String(idOrSlug)) ? getServiceById(idOrSlug, options) : getServiceBySlug(idOrSlug, options);
}

export async function listServicesForDoctor(doctorId) {
  const rows = await queryRows(
    `${SERVICE_SELECT} WHERE s.is_active AND EXISTS (SELECT 1 FROM doctor_services ds WHERE ds.service_id = s.id AND ds.doctor_id = $1) ORDER BY s.sort_order`,
    [doctorId],
  );
  return rows.map(toService);
}

const WRITABLE = {
  slug: "slug",
  name: "name",
  icon: "icon",
  durationMinutes: "duration_minutes",
  priceCents: "price_cents",
  shortDescription: "short_description",
  description: "description",
  highlights: "highlights",
  isDemo: "is_demo",
  sortOrder: "sort_order",
  isActive: "is_active",
};

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

export async function createService(input) {
  const { columns, values } = pick(input);
  const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");
  const { rows } = await query(`INSERT INTO services (${columns.join(", ")}) VALUES (${placeholders}) RETURNING id`, values);
  return getServiceById(rows[0].id, { includeInactive: true });
}

export async function updateService(id, patch) {
  const { columns, values } = pick(patch);
  if (columns.length) {
    const sets = columns.map((c, i) => `${c} = $${i + 2}`).join(", ");
    await query(`UPDATE services SET ${sets} WHERE id = $1`, [id, ...values]);
  }
  return getServiceById(id, { includeInactive: true });
}

export async function deactivateService(id) {
  await query("UPDATE services SET is_active = FALSE WHERE id = $1", [id]);
  return getServiceById(id, { includeInactive: true });
}
