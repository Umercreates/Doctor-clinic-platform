/**
 * Availability engine.
 *
 * For a doctor + service + date, bookable slots are derived from:
 *   1. the doctor's weekly schedule blocks (several per weekday allowed)
 *   2. schedule exceptions: blocked whole days / time ranges, or extra
 *      availability windows (doctor-specific or clinic-wide)
 *   3. existing appointments in an active status (pending / confirmed /
 *      rescheduled) — cancelled and completed ones never block
 *   4. the service duration (a 45-minute service yields 45-minute slots)
 *   5. booking rules: booking window, same-day lead time, slot step
 *
 * All dates/times are clinic-local "YYYY-MM-DD" / "HH:MM" strings; nothing is
 * converted to UTC. The same functions run inside the booking transaction
 * (with the transaction client) so availability is re-validated server-side
 * before insert; the database exclusion constraint is the final guard.
 */
import { addDays, isIsoDate, minutesToTime, parseIsoDate, timeToMinutes, toIsoDate, todayIso } from "@/lib/dates";
import { ApiError } from "@/server/http/errors";
import { APPOINTMENT_LIMITS } from "@/lib/validation/appointment";
import { getScheduleBlocks } from "@/lib/booking";
import { getDoctorById } from "@/server/repositories/doctorsRepository";
import { getServiceById } from "@/server/repositories/servicesRepository";
import * as appointments from "@/server/repositories/appointmentsRepository";
import * as availability from "@/server/repositories/availabilityRepository";

const RULES = APPOINTMENT_LIMITS;

// ---------------------------------------------------------------------------
// Pure helpers (exported for reuse/testing)
// ---------------------------------------------------------------------------

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

/** Subtract [bStart, bEnd) from a list of [start, end) windows (minutes). */
function subtractRange(windows, bStart, bEnd) {
  const out = [];
  for (const w of windows) {
    if (!overlaps(w.start, w.end, bStart, bEnd)) {
      out.push(w);
      continue;
    }
    if (w.start < bStart) out.push({ start: w.start, end: bStart });
    if (bEnd < w.end) out.push({ start: bEnd, end: w.end });
  }
  return out;
}

/**
 * Compute the open windows (minutes since midnight) for one date from the
 * weekly blocks and that day's exceptions.
 */
export function computeWindows({ blocks, exceptions }) {
  let windows = blocks.map((b) => ({ start: timeToMinutes(b.start), end: timeToMinutes(b.end) }));

  // Whole-day blocks first (start === null && !isAvailable) — nothing is bookable.
  if (exceptions.some((e) => !e.isAvailable && !e.start)) return [];

  for (const e of exceptions) {
    if (e.isAvailable || !e.start) continue;
    windows = subtractRange(windows, timeToMinutes(e.start), timeToMinutes(e.end));
  }
  for (const e of exceptions) {
    if (!e.isAvailable || !e.start) continue;
    windows.push({ start: timeToMinutes(e.start), end: timeToMinutes(e.end) });
  }
  return windows.filter((w) => w.end > w.start).sort((a, b) => a.start - b.start);
}

/**
 * Generate slots for the given windows.
 * @returns Array<{ startTime, endTime, available }>
 */
export function generateSlots({ windows, booked, slotMinutes, earliestMinutes = -1, step = RULES.slotStepMinutes }) {
  const slots = [];
  for (const w of windows) {
    for (let t = w.start; t + slotMinutes <= w.end; t += step) {
      if (t < earliestMinutes) continue;
      const end = t + slotMinutes;
      const taken = booked.some((b) => {
        const bStart = timeToMinutes(b.time);
        const bEnd = b.end ? timeToMinutes(b.end) : bStart + (b.durationMinutes || RULES.defaultSlotMinutes);
        return overlaps(t, end, bStart, bEnd);
      });
      slots.push({ startTime: minutesToTime(t), endTime: minutesToTime(end), available: !taken });
    }
  }
  return slots;
}

function bookingWindow() {
  const today = parseIsoDate(todayIso());
  const max = addDays(today, RULES.maxDaysAhead);
  return { today, max };
}

function earliestStartFor(date, today, now = new Date()) {
  const isToday = date.getTime() === today.getTime();
  return isToday ? now.getHours() * 60 + now.getMinutes() + RULES.minLeadMinutes : -1;
}

// ---------------------------------------------------------------------------
// Use-cases
// ---------------------------------------------------------------------------

async function loadContext({ doctorId, serviceId }) {
  const doctor = await getDoctorById(doctorId);
  if (!doctor) throw ApiError.notFound("Doctor not found.");
  const service = await getServiceById(serviceId);
  if (!service) throw ApiError.notFound("Service not found.");
  if (!doctor.serviceIds.includes(service.id)) {
    throw ApiError.badRequest("This doctor does not offer the selected service.");
  }
  return { doctor, service };
}

/**
 * Slots for one day.
 * @param {object} input { doctorId, serviceId, date, excludeAppointmentId? }
 * @param {object} [client] transaction client (booking / rescheduling)
 */
export async function getAvailability({ doctorId, serviceId, date, excludeAppointmentId = null }, client) {
  if (!isIsoDate(date)) throw ApiError.badRequest("A valid date (YYYY-MM-DD) is required.");
  const { doctor, service } = await loadContext({ doctorId, serviceId });
  const slotMinutes = service.durationMinutes || RULES.defaultSlotMinutes;

  const requested = parseIsoDate(date);
  const { today, max } = bookingWindow();
  const base = { doctorId: doctor.id, serviceId: service.id, date, slotMinutes };
  if (requested < today || requested > max) return { ...base, slots: [], reason: "outside-booking-window" };

  const blocks = getScheduleBlocks(doctor, requested.getDay());
  const [exceptions, booked] = await Promise.all([
    availability.listExceptions({ doctorId: doctor.id, from: date, to: date }, client),
    appointments.listBookedTimes({ doctorId: doctor.id, date, excludeAppointmentId }, client),
  ]);
  // Extra-availability exceptions can open a day the weekly schedule leaves empty.
  const windows = computeWindows({ blocks, exceptions });
  if (!windows.length) return { ...base, slots: [], reason: blocks.length ? "blocked" : "no-schedule" };

  const slots = generateSlots({ windows, booked, slotMinutes, earliestMinutes: earliestStartFor(requested, today) });
  return { ...base, slots, reason: slots.some((s) => s.available) ? null : "fully-booked" };
}

/** True if `time` is a bookable slot start for doctor/service/date. Runs inside transactions too. */
export async function isSlotAvailable({ doctorId, serviceId, date, time, excludeAppointmentId = null }, client) {
  const { slots } = await getAvailability({ doctorId, serviceId, date, excludeAppointmentId }, client);
  return slots.some((s) => s.startTime === time && s.available);
}

/**
 * Days in [from, to] that have at least one available slot for the doctor and
 * service. Used by the calendar so blocked / full / non-working days are
 * disabled before the visitor picks them.
 */
export async function getAvailableDays({ doctorId, serviceId, from, to }) {
  if (!isIsoDate(from) || !isIsoDate(to)) throw ApiError.badRequest("from/to must be YYYY-MM-DD.");
  const { doctor, service } = await loadContext({ doctorId, serviceId });
  const slotMinutes = service.durationMinutes || RULES.defaultSlotMinutes;
  const { today, max } = bookingWindow();

  let start = parseIsoDate(from);
  let end = parseIsoDate(to);
  if (end < start) throw ApiError.badRequest("`to` must be on or after `from`.");
  if ((end - start) / 86_400_000 > 62) throw ApiError.badRequest("Range may span at most two months.");
  if (start < today) start = today;
  if (end > max) end = max;
  if (end < start) return { doctorId: doctor.id, serviceId: service.id, from, to, days: [] };

  const [exceptions, bookedByDate] = await Promise.all([
    availability.listExceptions({ doctorId: doctor.id, from: toIsoDate(start), to: toIsoDate(end) }),
    appointments.listBookedTimesInRange({ doctorId: doctor.id, from: toIsoDate(start), to: toIsoDate(end) }),
  ]);

  const days = [];
  for (let d = new Date(start); d <= end; d = addDays(d, 1)) {
    const iso = toIsoDate(d);
    const blocks = getScheduleBlocks(doctor, d.getDay());
    const dayExceptions = exceptions.filter((e) => e.date === iso);
    if (!blocks.length && !dayExceptions.some((e) => e.isAvailable)) continue;
    const windows = computeWindows({ blocks, exceptions: dayExceptions });
    if (!windows.length) continue;
    const slots = generateSlots({ windows, booked: bookedByDate.get(iso) || [], slotMinutes, earliestMinutes: earliestStartFor(d, today) });
    if (slots.some((s) => s.available)) days.push(iso);
  }
  return { doctorId: doctor.id, serviceId: service.id, from: toIsoDate(start), to: toIsoDate(end), days };
}
