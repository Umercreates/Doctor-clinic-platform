/**
 * Appointments repository — in-memory demo implementation (no database).
 * Supports the public booking flow only; dashboard listing needs PostgreSQL.
 */
import { getMemoryStore } from "@/lib/database/memoryStore";
import { generateReference } from "@/lib/utils";
import { minutesToTime, timeToMinutes } from "@/lib/dates";
import { notAvailable } from "./notAvailable";

export const APPOINTMENT_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  RESCHEDULED: "rescheduled",
  CANCELLED: "cancelled",
  COMPLETED: "completed",
  NO_SHOW: "no_show",
};
export const APPOINTMENT_STATUSES = Object.values(APPOINTMENT_STATUS);
export const BLOCKING_STATUSES = [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.CONFIRMED, APPOINTMENT_STATUS.RESCHEDULED];

export async function listBookedTimes({ doctorId, date, excludeAppointmentId = null }) {
  const store = getMemoryStore();
  return store.appointments
    .filter((a) => a.doctorId === doctorId && a.date === date && BLOCKING_STATUSES.includes(a.status) && a.id !== excludeAppointmentId)
    .map((a) => ({ id: a.id, time: a.time, end: a.endTime, durationMinutes: a.durationMinutes }));
}

export async function listBookedTimesInRange({ doctorId, from, to }) {
  const store = getMemoryStore();
  const byDate = new Map();
  for (const a of store.appointments) {
    if (a.doctorId !== doctorId || a.date < from || a.date > to || !BLOCKING_STATUSES.includes(a.status)) continue;
    if (!byDate.has(a.date)) byDate.set(a.date, []);
    byDate.get(a.date).push({ time: a.time, end: a.endTime, durationMinutes: a.durationMinutes });
  }
  return byDate;
}

/** Demo booking: stores the request in memory and returns the public shape. */
export async function bookAppointment({ doctor, service, date, time, patient, notes, ensureAvailable }) {
  if (ensureAvailable) await ensureAvailable(null);
  const store = getMemoryStore();
  const now = new Date().toISOString();
  const appointment = {
    id: `apt_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    reference: generateReference("DOC"),
    status: APPOINTMENT_STATUS.PENDING,
    doctorId: doctor.id,
    serviceId: service.id,
    date,
    time,
    endTime: minutesToTime(timeToMinutes(time) + service.durationMinutes),
    durationMinutes: service.durationMinutes,
    patientNotes: notes || "",
    patient: { fullName: patient.fullName, email: patient.email, phone: patient.phone },
    doctor: { id: doctor.id, slug: doctor.slug, name: doctor.name, role: doctor.role },
    service: { id: service.id, slug: service.slug, name: service.name, durationMinutes: service.durationMinutes },
    source: "website",
    createdAt: now,
    updatedAt: now,
  };
  store.appointments.push(appointment);
  return appointment;
}

export async function getAppointmentByReference(reference) {
  return getMemoryStore().appointments.find((a) => a.reference === reference) || null;
}

export const getAppointmentById = notAvailable;
export const listAppointments = notAvailable;
export const countAppointmentsByStatus = notAvailable;
export const countAppointmentsOnDate = notAvailable;
export const updateAppointment = notAvailable;
export const rescheduleAppointment = notAvailable;
