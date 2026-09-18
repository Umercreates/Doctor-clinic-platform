/**
 * Doctors repository — PostgreSQL implementation.
 */
import { query, queryOne, queryRows, withTransaction } from "@/lib/database";
import { toDoctor } from "./mappers";

/** Base SELECT with aggregated care areas, service links and schedule blocks. */
const DOCTOR_SELECT = `
  SELECT d.*,
    COALESCE((SELECT array_agg(a.label ORDER BY a.sort_order) FROM doctor_care_areas a WHERE a.doctor_id = d.id), '{}') AS care_areas,
    COALESCE((SELECT array_agg(ds.service_id) FROM doctor_services ds JOIN services s ON s.id = ds.service_id AND s.is_active WHERE ds.doctor_id = d.id), '{}') AS service_ids,
    COALESCE((SELECT json_agg(json_build_object('id', sc.id, 'weekday', sc.weekday, 'start_time', sc.start_time, 'end_time', sc.end_time) ORDER BY sc.weekday, sc.start_time)
              FROM doctor_schedules sc WHERE sc.doctor_id = d.id AND sc.is_active), '[]') AS schedule_rows
  FROM doctors d
`;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function listDoctors({ includeInactive = false } = {}) {
  const rows = await queryRows(`${DOCTOR_SELECT} ${includeInactive ? "" : "WHERE d.is_active"} ORDER BY d.sort_order, d.name`);
  return rows.map(toDoctor);
}

export async function getDoctorBySlug(slug, { includeInactive = false } = {}) {
  const row = await queryOne(`${DOCTOR_SELECT} WHERE d.slug = $1 ${includeInactive ? "" : "AND d.is_active"}`, [slug]);
  return toDoctor(row);
}

export async function getDoctorById(id, { includeInactive = false } = {}) {
  if (!UUID_RE.test(String(id))) return null;
  const row = await queryOne(`${DOCTOR_SELECT} WHERE d.id = $1 ${includeInactive ? "" : "AND d.is_active"}`, [id]);
  return toDoctor(row);
}

/** Accepts either a UUID or a slug. */
export async function getDoctorByIdOrSlug(idOrSlug, options) {
  return UUID_RE.test(String(idOrSlug)) ? getDoctorById(idOrSlug, options) : getDoctorBySlug(idOrSlug, options);
}

export async function getLeadDoctor() {
  const row =
    (await queryOne(`${DOCTOR_SELECT} WHERE d.is_active AND d.is_lead ORDER BY d.sort_order LIMIT 1`)) ||
    (await queryOne(`${DOCTOR_SELECT} WHERE d.is_active ORDER BY d.sort_order LIMIT 1`));
  return toDoctor(row);
}

export async function listDoctorsByService(serviceId) {
  const rows = await queryRows(
    `${DOCTOR_SELECT} WHERE d.is_active AND EXISTS (SELECT 1 FROM doctor_services ds WHERE ds.doctor_id = d.id AND ds.service_id = $1) ORDER BY d.sort_order`,
    [serviceId],
  );
  return rows.map(toDoctor);
}

const WRITABLE = {
  slug: "slug",
  name: "name",
  title: "title",
  role: "role",
  roleIsDemo: "role_is_demo",
  isLead: "is_lead",
  location: "location",
  photoUrl: "photo_url",
  photoAlt: "photo_alt",
  photoPosition: "photo_position",
  shortBio: "short_bio",
  bio: "bio",
  bioIsDemo: "bio_is_demo",
  languages: "languages",
  acceptingNewPatients: "accepting_new_patients",
  sortOrder: "sort_order",
  isActive: "is_active",
};

function buildInsert(input) {
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

async function syncRelations(client, doctorId, { careAreas, serviceIds }) {
  if (careAreas) {
    await query("DELETE FROM doctor_care_areas WHERE doctor_id = $1", [doctorId], client);
    for (const [index, label] of careAreas.entries()) {
      await query("INSERT INTO doctor_care_areas (doctor_id, label, sort_order) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING", [doctorId, label, index], client);
    }
  }
  if (serviceIds) {
    await query("DELETE FROM doctor_services WHERE doctor_id = $1", [doctorId], client);
    for (const serviceId of serviceIds) {
      await query("INSERT INTO doctor_services (doctor_id, service_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [doctorId, serviceId], client);
    }
  }
}

export async function createDoctor(input) {
  const { columns, values } = buildInsert(input);
  const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");
  const id = await withTransaction(async (client) => {
    const { rows } = await query(`INSERT INTO doctors (${columns.join(", ")}) VALUES (${placeholders}) RETURNING id`, values, client);
    await syncRelations(client, rows[0].id, input);
    return rows[0].id;
  });
  return getDoctorById(id, { includeInactive: true });
}

export async function updateDoctor(id, patch) {
  const { columns, values } = buildInsert(patch);
  await withTransaction(async (client) => {
    if (columns.length) {
      const sets = columns.map((c, i) => `${c} = $${i + 2}`).join(", ");
      await query(`UPDATE doctors SET ${sets} WHERE id = $1`, [id, ...values], client);
    }
    await syncRelations(client, id, patch);
  });
  return getDoctorById(id, { includeInactive: true });
}

/** Soft delete: the profile disappears from the site but history stays intact. */
export async function deactivateDoctor(id) {
  await query("UPDATE doctors SET is_active = FALSE WHERE id = $1", [id]);
  return getDoctorById(id, { includeInactive: true });
}
