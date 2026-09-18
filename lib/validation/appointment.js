import { isIsoDate, isTimeString, parseIsoDate, todayIso } from "@/lib/dates";
import { email, firstError, maxLength, minLength, normalizeString, phone, required } from "./common";

/**
 * Booking rules shared by the calendar (client) and the availability service
 * (server) so both agree on what is bookable. Later these move to the
 * `website_settings` table and are editable from the dashboard.
 */
export const APPOINTMENT_LIMITS = {
  nameMin: 2,
  nameMax: 100,
  notesMax: 1000,
  /** How far ahead patients may book (days). */
  maxDaysAhead: 90,
  /** Same-day bookings need at least this much notice (minutes). */
  minLeadMinutes: 60,
  /** Slot start times are offered on this grid (minutes). */
  slotStepMinutes: 30,
  /** Slot length when a service has no duration (minutes). */
  defaultSlotMinutes: 30,
};

/** Validate patient details entered in the booking form. */
export function validatePatientDetails(input = {}) {
  const errors = {};

  const fullName = normalizeString(input.fullName);
  const nameError = firstError(
    required(fullName, "Full name"),
    minLength(fullName, APPOINTMENT_LIMITS.nameMin, "Full name"),
    maxLength(fullName, APPOINTMENT_LIMITS.nameMax, "Full name"),
  );
  if (nameError) errors.fullName = nameError;

  const emailError = email(input.email);
  if (emailError) errors.email = emailError;

  const phoneError = phone(input.phone);
  if (phoneError) errors.phone = phoneError;

  const notesError = maxLength(input.notes, APPOINTMENT_LIMITS.notesMax, "Notes");
  if (notesError) errors.notes = notesError;

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    value: {
      fullName,
      email: normalizeString(input.email).toLowerCase(),
      phone: normalizeString(input.phone),
      notes: normalizeString(input.notes),
    },
  };
}

/**
 * Validate a complete appointment request (used by the API and the review step).
 * Existence of the doctor/service is checked by the service layer, not here.
 */
export function validateAppointmentRequest(input = {}) {
  const errors = {};

  const doctorId = normalizeString(input.doctorId);
  const serviceId = normalizeString(input.serviceId);
  const date = normalizeString(input.date);
  const time = normalizeString(input.time);

  if (!doctorId) errors.doctorId = "Please choose a doctor.";
  if (!serviceId) errors.serviceId = "Please choose a service.";

  if (!isIsoDate(date)) {
    errors.date = "Please choose a valid date.";
  } else {
    const today = parseIsoDate(todayIso());
    const chosen = parseIsoDate(date);
    const max = new Date(today);
    max.setDate(max.getDate() + APPOINTMENT_LIMITS.maxDaysAhead);
    if (chosen < today) errors.date = "Appointments cannot be booked in the past.";
    else if (chosen > max) errors.date = `Appointments can be booked up to ${APPOINTMENT_LIMITS.maxDaysAhead} days ahead.`;
  }

  if (!isTimeString(time)) errors.time = "Please choose a valid time.";

  const patient = validatePatientDetails(input.patient || {});
  Object.assign(errors, patient.errors);

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    value: { doctorId, serviceId, date, time, patient: patient.value },
  };
}
