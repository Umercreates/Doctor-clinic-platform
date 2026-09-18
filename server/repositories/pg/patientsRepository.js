/**
 * Patients repository — PostgreSQL implementation.
 *
 * Patient data is sensitive: these functions are only called from
 * authenticated dashboard services and the booking transaction. Only contact
 * details needed for appointment management are stored.
 */
import { query, queryOne, queryRows } from "@/lib/database";
import { toPatient } from "./mappers";

export async function findPatientByEmail(email, client) {
  const row = await queryOne("SELECT * FROM patients WHERE lower(email) = lower($1)", [email], client);
  return toPatient(row);
}

export async function getPatientById(id, { doctorId } = {}) {
  // When scoped to a doctor, the patient must have an appointment with them.
  const row = await queryOne(
    `SELECT p.*,
       (SELECT count(*) FROM appointments a WHERE a.patient_id = p.id ${doctorId ? "AND a.doctor_id = $2" : ""}) AS appointment_count,
       (SELECT max(a.appointment_date) FROM appointments a WHERE a.patient_id = p.id ${doctorId ? "AND a.doctor_id = $2" : ""}) AS last_appointment_date
     FROM patients p WHERE p.id = $1
     ${doctorId ? "AND EXISTS (SELECT 1 FROM appointments a WHERE a.patient_id = p.id AND a.doctor_id = $2)" : ""}`,
    doctorId ? [id, doctorId] : [id],
  );
  return toPatient(row);
}

/**
 * Find-or-create by email inside the booking transaction. Existing patients
 * get their name/phone refreshed from the latest booking.
 */
export async function upsertPatient({ fullName, email, phone }, client) {
  const row = await queryOne(
    `INSERT INTO patients (full_name, email, phone)
     VALUES ($1, $2, $3)
     ON CONFLICT ((lower(email))) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone
     RETURNING *`,
    [fullName, email, phone],
    client,
  );
  return toPatient(row);
}

/**
 * Dashboard listing. `doctorId` restricts to patients who have an appointment
 * with that doctor (used for the doctor role).
 */
export async function listPatients({ search, doctorId, limit = 25, offset = 0 } = {}) {
  const where = [];
  const params = [];
  if (doctorId) {
    params.push(doctorId);
    where.push(`EXISTS (SELECT 1 FROM appointments a WHERE a.patient_id = p.id AND a.doctor_id = $${params.length})`);
  }
  if (search) {
    params.push(`%${search}%`);
    where.push(`(p.full_name ILIKE $${params.length} OR p.email ILIKE $${params.length} OR p.phone ILIKE $${params.length})`);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const safeLimit = Math.min(Math.max(Number(limit) || 25, 1), 100);
  const safeOffset = Math.max(Number(offset) || 0, 0);
  const scope = doctorId ? "AND a.doctor_id = $1" : "";

  const [rows, count] = await Promise.all([
    queryRows(
      `SELECT p.*,
         (SELECT count(*) FROM appointments a WHERE a.patient_id = p.id ${scope}) AS appointment_count,
         (SELECT max(a.appointment_date) FROM appointments a WHERE a.patient_id = p.id ${scope}) AS last_appointment_date
       FROM patients p ${whereSql}
       ORDER BY p.full_name LIMIT ${safeLimit} OFFSET ${safeOffset}`,
      params,
    ),
    queryOne(`SELECT count(*)::int AS total FROM patients p ${whereSql}`, params),
  ]);
  return { items: rows.map(toPatient), total: count.total, limit: safeLimit, offset: safeOffset };
}

export async function countPatients({ doctorId } = {}) {
  const row = await queryOne(
    doctorId
      ? "SELECT count(DISTINCT patient_id)::int AS total FROM appointments WHERE doctor_id = $1"
      : "SELECT count(*)::int AS total FROM patients",
    doctorId ? [doctorId] : [],
  );
  return row.total;
}

export async function updatePatient(id, patch) {
  const sets = [];
  const params = [id];
  for (const [key, column] of Object.entries({ fullName: "full_name", email: "email", phone: "phone", notes: "notes" })) {
    if (patch[key] !== undefined) {
      params.push(patch[key]);
      sets.push(`${column} = $${params.length}`);
    }
  }
  if (sets.length) await query(`UPDATE patients SET ${sets.join(", ")} WHERE id = $1`, params);
  return getPatientById(id);
}
