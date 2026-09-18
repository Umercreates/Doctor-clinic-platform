/**
 * Availability repository — PostgreSQL implementation.
 * Weekly schedule blocks (doctor_schedules) and one-off exceptions/blocked
 * dates (schedule_exceptions). The slot engine itself arrives in the booking phase.
 */
import { query, queryOne, queryRows } from "@/lib/database";
import { toHm, toIso } from "./mappers";

function toBlock(row) {
  return {
    id: row.id,
    doctorId: row.doctor_id,
    weekday: Number(row.weekday),
    start: toHm(row.start_time),
    end: toHm(row.end_time),
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toException(row) {
  return {
    id: row.id,
    doctorId: row.doctor_id,
    date: toIso(row.date),
    start: toHm(row.start_time),
    end: toHm(row.end_time),
    isAvailable: row.is_available,
    reason: row.reason,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listScheduleBlocks({ doctorId, includeInactive = false } = {}, client) {
  const rows = await queryRows(
    `SELECT * FROM doctor_schedules WHERE ($1::uuid IS NULL OR doctor_id = $1) ${includeInactive ? "" : "AND is_active"} ORDER BY doctor_id, weekday, start_time`,
    [doctorId || null],
    client,
  );
  return rows.map(toBlock);
}

export async function getScheduleBlock(id) {
  const row = await queryOne("SELECT * FROM doctor_schedules WHERE id = $1", [id]);
  return row ? toBlock(row) : null;
}

export async function createScheduleBlock({ doctorId, weekday, start, end }) {
  const row = await queryOne(
    "INSERT INTO doctor_schedules (doctor_id, weekday, start_time, end_time) VALUES ($1, $2, $3, $4) RETURNING *",
    [doctorId, weekday, start, end],
  );
  return toBlock(row);
}

export async function updateScheduleBlock(id, patch) {
  const sets = [];
  const params = [id];
  for (const [key, column] of Object.entries({ weekday: "weekday", start: "start_time", end: "end_time", isActive: "is_active" })) {
    if (patch[key] !== undefined) {
      params.push(patch[key]);
      sets.push(`${column} = $${params.length}`);
    }
  }
  if (sets.length) await query(`UPDATE doctor_schedules SET ${sets.join(", ")} WHERE id = $1`, params);
  return getScheduleBlock(id);
}

export async function deleteScheduleBlock(id) {
  const { rowCount } = await query("DELETE FROM doctor_schedules WHERE id = $1", [id]);
  return rowCount > 0;
}

export async function listExceptions({ doctorId, from, to } = {}, client) {
  const rows = await queryRows(
    `SELECT * FROM schedule_exceptions
     WHERE ($1::uuid IS NULL OR doctor_id = $1 OR doctor_id IS NULL)
       AND ($2::date IS NULL OR date >= $2) AND ($3::date IS NULL OR date <= $3)
     ORDER BY date, start_time NULLS FIRST`,
    [doctorId || null, from || null, to || null],
    client,
  );
  return rows.map(toException);
}

export async function getException(id) {
  const row = await queryOne("SELECT * FROM schedule_exceptions WHERE id = $1", [id]);
  return row ? toException(row) : null;
}

export async function updateException(id, patch) {
  const sets = [];
  const params = [id];
  const columns = { date: "date", start: "start_time", end: "end_time", isAvailable: "is_available", reason: "reason" };
  for (const [key, column] of Object.entries(columns)) {
    if (patch[key] !== undefined) {
      params.push(patch[key]);
      sets.push(`${column} = $${params.length}`);
    }
  }
  if (sets.length) await query(`UPDATE schedule_exceptions SET ${sets.join(", ")} WHERE id = $1`, params);
  return getException(id);
}

export async function createException({ doctorId = null, date, start = null, end = null, isAvailable = false, reason = null, createdBy = null }) {
  const row = await queryOne(
    `INSERT INTO schedule_exceptions (doctor_id, date, start_time, end_time, is_available, reason, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [doctorId, date, start, end, isAvailable, reason, createdBy],
  );
  return toException(row);
}

export async function deleteException(id) {
  const { rowCount } = await query("DELETE FROM schedule_exceptions WHERE id = $1", [id]);
  return rowCount > 0;
}
