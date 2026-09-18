/**
 * Appointments repository.
 *
 * Demo phase: writes to an in-memory store. Backend phase: same interface
 * backed by the `appointments` table (with the exclusion constraint that
 * prevents double booking at the database level).
 */
import { getMemoryStore } from "@/lib/database/memoryStore";
import { generateReference } from "@/lib/utils";

export const APPOINTMENT_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  CANCELLED: "cancelled",
  COMPLETED: "completed",
  NO_SHOW: "no_show",
};

const BLOCKING_STATUSES = new Set([APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.CONFIRMED]);

export async function listBookedTimes({ doctorId, date }) {
  const store = getMemoryStore();
  return store.appointments
    .filter((a) => a.doctorId === doctorId && a.date === date && BLOCKING_STATUSES.has(a.status))
    .map((a) => ({ time: a.time, durationMinutes: a.durationMinutes }));
}

export async function createAppointment(input) {
  const store = getMemoryStore();
  const now = new Date().toISOString();
  const appointment = {
    id: `apt_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    reference: generateReference("DOC"),
    status: APPOINTMENT_STATUS.PENDING,
    createdAt: now,
    updatedAt: now,
    ...input,
  };
  store.appointments.push(appointment);
  return appointment;
}

export async function getAppointmentByReference(reference) {
  const store = getMemoryStore();
  return store.appointments.find((a) => a.reference === reference) || null;
}
