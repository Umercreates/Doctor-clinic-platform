/**
 * Availability calculation.
 *
 * Generates bookable time slots for a doctor on a given date from the doctor's
 * weekly schedule, the requested service duration, and existing bookings.
 * The double-booking guarantee will be enforced at the database level in a
 * later phase; this module provides the same logic for the UI and the API.
 */
import { isIsoDate, minutesToTime, parseIsoDate, timeToMinutes, todayIso } from "@/lib/dates";
import { ApiError } from "@/server/http/errors";
import { getDoctorById } from "@/server/repositories/doctorsRepository";
import { getServiceById } from "@/server/repositories/servicesRepository";
import { listBookedTimes } from "@/server/repositories/appointmentsRepository";
import { APPOINTMENT_LIMITS } from "@/lib/validation/appointment";
import { getScheduleBlocks } from "@/lib/booking";

const { defaultSlotMinutes: DEFAULT_SLOT_MINUTES, slotStepMinutes: SLOT_STEP_MINUTES, minLeadMinutes: MIN_LEAD_MINUTES } =
  APPOINTMENT_LIMITS;

function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * @returns {Promise<{ doctorId: string, date: string, slotMinutes: number, slots: Array<{time: string, available: boolean}> }>}
 */
export async function getAvailability({ doctorId, date, serviceId }) {
  if (!isIsoDate(date)) throw ApiError.badRequest("A valid date (YYYY-MM-DD) is required.");

  const doctor = await getDoctorById(doctorId);
  if (!doctor) throw ApiError.notFound("Doctor not found.");

  let slotMinutes = DEFAULT_SLOT_MINUTES;
  if (serviceId) {
    const service = await getServiceById(serviceId);
    if (!service) throw ApiError.notFound("Service not found.");
    if (!doctor.serviceIds.includes(service.id)) {
      throw ApiError.badRequest("This doctor does not offer the selected service.");
    }
    slotMinutes = service.durationMinutes || DEFAULT_SLOT_MINUTES;
  }

  const requested = parseIsoDate(date);
  const today = parseIsoDate(todayIso());
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + APPOINTMENT_LIMITS.maxDaysAhead);

  if (requested < today || requested > maxDate) {
    return { doctorId, date, slotMinutes, slots: [] };
  }

  const blocks = getScheduleBlocks(doctor, requested.getDay());
  const booked = await listBookedTimes({ doctorId, date });

  const now = new Date();
  const isToday = requested.getTime() === today.getTime();
  const earliestMinutes = isToday ? now.getHours() * 60 + now.getMinutes() + MIN_LEAD_MINUTES : -1;

  const slots = [];
  for (const block of blocks) {
    const start = timeToMinutes(block.start);
    const end = timeToMinutes(block.end);
    for (let t = start; t + slotMinutes <= end; t += SLOT_STEP_MINUTES) {
      if (t < earliestMinutes) continue;
      const slotEnd = t + slotMinutes;
      const clash = booked.some((b) => {
        const bStart = timeToMinutes(b.time);
        const bEnd = bStart + (b.durationMinutes || DEFAULT_SLOT_MINUTES);
        return rangesOverlap(t, slotEnd, bStart, bEnd);
      });
      slots.push({ time: minutesToTime(t), available: !clash });
    }
  }

  return { doctorId, date, slotMinutes, slots };
}

/** True if the given time is a bookable slot for the doctor/service/date. */
export async function isSlotAvailable({ doctorId, serviceId, date, time }) {
  const { slots } = await getAvailability({ doctorId, date, serviceId });
  return slots.some((s) => s.time === time && s.available);
}
