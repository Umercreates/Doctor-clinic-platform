/**
 * Appointments repository — PostgreSQL implementation.
 *
 * Scheduling model: `appointment_date` (DATE) + `start_time`/`end_time` (TIME)
 * in the clinic's local time zone. The database excludes overlapping active
 * appointments per doctor (see migration 0001), so a race between two bookings
 * surfaces as a 409 conflict rather than a double booking.
 */
import { likePattern, query, queryOne, queryRows, withTransaction } from "@/lib/database";
import { generateReference } from "@/lib/utils";
import { toAppointment } from "./mappers";
import { upsertPatient } from "./patientsRepository";

export const APPOINTMENT_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  RESCHEDULED: "rescheduled",
  CANCELLED: "cancelled",
  COMPLETED: "completed",
  NO_SHOW: "no_show",
};

export const APPOINTMENT_STATUSES = Object.values(APPOINTMENT_STATUS);
/** Statuses that occupy a doctor's time (mirrors the exclusion constraint). */
export const BLOCKING_STATUSES = [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.CONFIRMED, APPOINTMENT_STATUS.RESCHEDULED];

const APPOINTMENT_SELECT = `
  SELECT a.*,
    EXTRACT(EPOCH FROM (a.end_time - a.start_time)) / 60 AS duration_minutes,
    d.name AS doctor_name, d.slug AS doctor_slug, d.role AS doctor_role,
    s.name AS service_name, s.slug AS service_slug, s.duration_minutes AS service_duration,
    p.full_name AS patient_name, p.email AS patient_email, p.phone AS patient_phone
  FROM appointments a
  JOIN doctors d ON d.id = a.doctor_id
  JOIN services s ON s.id = a.service_id
  JOIN patients p ON p.id = a.patient_id
`;

/** Times already taken for a doctor on a date (active statuses only). */
export async function listBookedTimes({ doctorId, date, excludeAppointmentId = null }, client) {
  const rows = await queryRows(
    `SELECT id, start_time, end_time, EXTRACT(EPOCH FROM (end_time - start_time)) / 60 AS duration_minutes
     FROM appointments
     WHERE doctor_id = $1 AND appointment_date = $2 AND status = ANY($3::appointment_status[])
       AND ($4::uuid IS NULL OR id <> $4)`,
    [doctorId, date, BLOCKING_STATUSES, excludeAppointmentId],
    client,
  );
  return rows.map((r) => ({
    id: r.id,
    time: String(r.start_time).slice(0, 5),
    end: String(r.end_time).slice(0, 5),
    durationMinutes: Number(r.duration_minutes),
  }));
}

/** Booked times for a doctor across a date range, grouped by ISO date. */
export async function listBookedTimesInRange({ doctorId, from, to }) {
  const rows = await queryRows(
    `SELECT appointment_date, start_time, end_time, EXTRACT(EPOCH FROM (end_time - start_time)) / 60 AS duration_minutes
     FROM appointments
     WHERE doctor_id = $1 AND appointment_date BETWEEN $2 AND $3 AND status = ANY($4::appointment_status[])`,
    [doctorId, from, to, BLOCKING_STATUSES],
  );
  const byDate = new Map();
  for (const r of rows) {
    const key = String(r.appointment_date).slice(0, 10);
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key).push({ time: String(r.start_time).slice(0, 5), end: String(r.end_time).slice(0, 5), durationMinutes: Number(r.duration_minutes) });
  }
  return byDate;
}

/** Serialize bookings for one doctor/day inside a transaction (released at commit). */
async function lockDoctorDay(client, doctorId, date) {
  await query("SELECT pg_advisory_xact_lock(hashtext($1 || ':' || $2))", [doctorId, date], client);
}

/**
 * Insert an appointment. `input.time` is "HH:MM"; `end_time` is derived from
 * the duration. Pass a transaction client when creating the patient in the
 * same unit of work.
 */
export async function createAppointment(input, client) {
  const row = await queryOne(
    `INSERT INTO appointments (reference, doctor_id, service_id, patient_id, appointment_date, start_time, end_time, patient_notes, source, status)
     VALUES ($1, $2, $3, $4, $5, $6::time, ($6::time + make_interval(mins => $7::int)), $8, $9, 'pending')
     RETURNING id`,
    [
      generateReference("DOC"),
      input.doctorId,
      input.serviceId,
      input.patientId,
      input.date,
      input.time,
      input.durationMinutes,
      input.notes || null,
      input.source || "website",
    ],
    client,
  );
  return getAppointmentById(row.id, client);
}

/**
 * Public booking: find-or-create the patient and insert the appointment in one
 * transaction. The exclusion constraint guarantees no overlapping active
 * appointment for the doctor even under concurrent requests.
 */
export async function bookAppointment({ doctor, service, date, time, patient, notes, ensureAvailable }) {
  return withTransaction(async (client) => {
    await lockDoctorDay(client, doctor.id, date);
    if (ensureAvailable) await ensureAvailable(client);
    const savedPatient = await upsertPatient(patient, client);
    return createAppointment(
      {
        doctorId: doctor.id,
        serviceId: service.id,
        patientId: savedPatient.id,
        date,
        time,
        durationMinutes: service.durationMinutes,
        notes,
        source: "website",
      },
      client,
    );
  });
}

export async function getAppointmentById(id, client) {
  const row = await queryOne(`${APPOINTMENT_SELECT} WHERE a.id = $1`, [id], client);
  return toAppointment(row);
}

export async function getAppointmentByReference(reference) {
  const row = await queryOne(`${APPOINTMENT_SELECT} WHERE a.reference = $1`, [reference]);
  return toAppointment(row);
}

/**
 * Dashboard listing with optional filters.
 * @param {object} f  { doctorId, patientId, status, date, from, to, search, limit, offset }
 */
export async function listAppointments(f = {}) {
  const where = [];
  const params = [];
  const add = (clause, value) => {
    params.push(value);
    where.push(clause.replace("?", `$${params.length}`));
  };
  if (f.doctorId) add("a.doctor_id = ?", f.doctorId);
  if (f.patientId) add("a.patient_id = ?", f.patientId);
  if (f.status) add("a.status = ?::appointment_status", f.status);
  if (f.date) add("a.appointment_date = ?", f.date);
  if (f.from) add("a.appointment_date >= ?", f.from);
  if (f.to) add("a.appointment_date <= ?", f.to);
  if (f.search) {
    params.push(likePattern(f.search));
    const i = params.length;
    where.push(`(p.full_name ILIKE $${i} ESCAPE '\\' OR p.email ILIKE $${i} ESCAPE '\\' OR a.reference ILIKE $${i} ESCAPE '\\')`);
  }

  const limit = Math.min(Math.max(Number(f.limit) || 25, 1), 100);
  const offset = Math.max(Number(f.offset) || 0, 0);
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const [rows, count] = await Promise.all([
    queryRows(`${APPOINTMENT_SELECT} ${whereSql} ORDER BY a.appointment_date DESC, a.start_time DESC LIMIT ${limit} OFFSET ${offset}`, params),
    queryOne(`SELECT count(*)::int AS total FROM appointments a JOIN patients p ON p.id = a.patient_id ${whereSql}`, params),
  ]);
  return { items: rows.map(toAppointment), total: count.total, limit, offset };
}

/** Status counts for dashboard summaries (optionally scoped to a doctor). */
export async function countAppointmentsByStatus({ doctorId } = {}) {
  const rows = await queryRows(
    `SELECT status, count(*)::int AS count FROM appointments ${doctorId ? "WHERE doctor_id = $1" : ""} GROUP BY status`,
    doctorId ? [doctorId] : [],
  );
  const counts = Object.fromEntries(APPOINTMENT_STATUSES.map((s) => [s, 0]));
  for (const r of rows) counts[r.status] = r.count;
  return counts;
}

/** Active appointments with a date in [from, to] (inclusive). */
export async function countAppointmentsInRange(from, to, { doctorId } = {}) {
  const row = await queryOne(
    `SELECT count(*)::int AS total FROM appointments WHERE appointment_date BETWEEN $1 AND $2 AND status = ANY($3::appointment_status[]) ${doctorId ? "AND doctor_id = $4" : ""}`,
    doctorId ? [from, to, BLOCKING_STATUSES, doctorId] : [from, to, BLOCKING_STATUSES],
  );
  return row.total;
}

export async function countAppointmentsOnDate(date, { doctorId } = {}) {
  const row = await queryOne(
    `SELECT count(*)::int AS total FROM appointments WHERE appointment_date = $1 AND status = ANY($2::appointment_status[]) ${doctorId ? "AND doctor_id = $3" : ""}`,
    doctorId ? [date, BLOCKING_STATUSES, doctorId] : [date, BLOCKING_STATUSES],
  );
  return row.total;
}

const WRITABLE = {
  status: "status",
  internalNotes: "internal_notes",
  patientNotes: "patient_notes",
  cancelReason: "cancel_reason",
};

/**
 * Move an appointment to a new date/time in one transaction. The row is
 * locked, availability is re-checked (excluding the appointment itself), and
 * the exclusion constraint remains the final guard against a concurrent booking.
 */
export async function rescheduleAppointment(id, { date, time, durationMinutes, updatedBy = null, ensureAvailable }) {
  return withTransaction(async (client) => {
    const current = await queryOne("SELECT * FROM appointments WHERE id = $1 FOR UPDATE", [id], client);
    if (!current) return null;
    await lockDoctorDay(client, current.doctor_id, date);
    if (ensureAvailable) await ensureAvailable(client, current);
    await query(
      `UPDATE appointments
       SET appointment_date = $2, start_time = $3::time, end_time = ($3::time + make_interval(mins => $4::int)),
           status = 'rescheduled', rescheduled_at = now(), rescheduled_from_date = appointment_date,
           rescheduled_from_time = start_time, reschedule_count = reschedule_count + 1, updated_by = $5
       WHERE id = $1`,
      [id, date, time, durationMinutes, updatedBy],
      client,
    );
    return getAppointmentById(id, client);
  });
}

/** Patch mutable fields. Status transitions stamp cancelled_at / confirmed_at / completed_at. */
export async function updateAppointment(id, patch, { updatedBy = null } = {}) {
  const sets = [];
  const params = [id];
  if (updatedBy) {
    params.push(updatedBy);
    sets.push(`updated_by = $${params.length}`);
  }
  for (const [key, column] of Object.entries(WRITABLE)) {
    if (patch[key] !== undefined) {
      params.push(patch[key]);
      sets.push(`${column} = $${params.length}${column === "status" ? "::appointment_status" : ""}`);
    }
  }
  if (patch.status === APPOINTMENT_STATUS.CANCELLED) sets.push("cancelled_at = now()");
  if (patch.status === APPOINTMENT_STATUS.CONFIRMED) sets.push("confirmed_at = now()");
  if (patch.status === APPOINTMENT_STATUS.COMPLETED) sets.push("completed_at = now()");
  if (sets.length) {
    await query(`UPDATE appointments SET ${sets.join(", ")} WHERE id = $1`, params);
  }
  return getAppointmentById(id);
}
