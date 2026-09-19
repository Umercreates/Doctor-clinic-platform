/**
 * Appointment use-cases.
 *
 * Public booking: validate → check availability → transaction (advisory lock
 * per doctor/day, re-check availability, upsert patient, insert) → the
 * database exclusion constraint is the final guard. Two simultaneous requests
 * for one slot yield one 201 and one 409 SLOT_UNAVAILABLE.
 *
 * Dashboard operations are scoped by role: admins/staff see everything,
 * doctors only their own appointments. Status transitions are validated
 * server-side; records are never deleted, cancellation releases the slot.
 */
import { ApiError } from "@/server/http/errors";
import { validateAppointmentRequest } from "@/lib/validation/appointment";
import {
  RESCHEDULABLE_STATUSES,
  canTransition,
  validateAppointmentPatch,
  validateReschedule,
} from "@/lib/validation/appointmentAdmin";
import { addDays, isIsoDate, parseIsoDate, toIsoDate, todayIso } from "@/lib/dates";
import { isDatabaseConfigured } from "@/lib/database";
import { canAccessDoctorRecord } from "@/server/auth/permissions";
import { getDoctorById } from "@/server/repositories/doctorsRepository";
import { getServiceById } from "@/server/repositories/servicesRepository";
import * as appointments from "@/server/repositories/appointmentsRepository";
import { getAvailability, isSlotAvailable } from "@/server/services/availabilityService";
import { NOTIFICATION_TEMPLATES, queueAppointmentNotification } from "@/server/services/notificationService";

/** Shape returned to the public booking flow. Never exposes internal notes. */
function toPublicAppointment(appointment, doctor, service) {
  return {
    reference: appointment.reference,
    status: appointment.status,
    date: appointment.date,
    time: appointment.time,
    endTime: appointment.endTime,
    durationMinutes: appointment.durationMinutes ?? service.durationMinutes,
    doctor: { id: doctor.id, slug: doctor.slug, name: doctor.name, role: doctor.role },
    service: { id: service.id, slug: service.slug, name: service.name },
    patient: {
      fullName: appointment.patient.fullName,
      email: appointment.patient.email,
      phone: appointment.patient.phone,
      notes: appointment.patientNotes || "",
    },
    createdAt: appointment.createdAt,
    isDemo: !isDatabaseConfigured(),
  };
}

export async function bookAppointment(input) {
  const validation = validateAppointmentRequest(input);
  if (!validation.valid) throw ApiError.validation(validation.errors);

  const { doctorId, serviceId, date, time, patient } = validation.value;

  const doctor = await getDoctorById(doctorId);
  if (!doctor) throw ApiError.validation({ doctorId: "Please choose a valid doctor." });

  const service = await getServiceById(serviceId);
  if (!service) throw ApiError.validation({ serviceId: "Please choose a valid service." });

  if (!doctor.serviceIds.includes(service.id)) {
    throw ApiError.validation({ serviceId: `${doctor.name} does not offer ${service.name}.` });
  }

  // Never trust availability from the browser: compute it here first...
  if (!(await isSlotAvailable({ doctorId, serviceId, date, time }))) throw ApiError.slotUnavailable();

  // ...and again inside the transaction, after the per-day lock.
  const appointment = await appointments.bookAppointment({
    doctor,
    service,
    date,
    time,
    patient: { fullName: patient.fullName, email: patient.email, phone: patient.phone },
    notes: patient.notes,
    ensureAvailable: async (client) => {
      if (!(await isSlotAvailable({ doctorId, serviceId, date, time }, client))) throw ApiError.slotUnavailable();
    },
  });

  // Outbox only: nothing is delivered until a provider is configured (see notificationService).
  await queueAppointmentNotification(NOTIFICATION_TEMPLATES.REQUESTED, { ...appointment, doctor, service });
  return toPublicAppointment(appointment, doctor, service);
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export async function listAppointmentsForUser(scope, filters = {}) {
  const effective = { ...filters };
  if (!scope.all) {
    if (filters.doctorId && filters.doctorId !== scope.doctorId) throw ApiError.forbidden();
    effective.doctorId = scope.doctorId;
  }
  return appointments.listAppointments(effective);
}

export async function getAppointmentForUser(user, id) {
  const appointment = await appointments.getAppointmentById(id);
  if (!appointment) throw ApiError.notFound("Appointment not found.");
  if (!canAccessDoctorRecord(user, "appointments:read", appointment.doctorId)) throw ApiError.forbidden();
  return appointment;
}

async function getWritableAppointment(user, id) {
  const existing = await appointments.getAppointmentById(id);
  if (!existing) throw ApiError.notFound("Appointment not found.");
  if (!canAccessDoctorRecord(user, "appointments:write", existing.doctorId)) throw ApiError.forbidden();
  return existing;
}

export async function updateAppointmentForUser(user, id, input) {
  const validation = validateAppointmentPatch(input);
  if (!validation.valid) throw ApiError.validation(validation.errors);

  const existing = await getWritableAppointment(user, id);
  if (validation.value.status && !canTransition(existing.status, validation.value.status)) {
    throw ApiError.validation({
      status: `An appointment that is ${existing.status} cannot be marked ${validation.value.status}.`,
    });
  }
  if (validation.value.status === "rescheduled") {
    throw ApiError.validation({ status: "Use the reschedule action to move an appointment to a new time." });
  }
  const updated = await appointments.updateAppointment(id, validation.value, { updatedBy: user.id });
  if (validation.value.status === "confirmed") await queueAppointmentNotification(NOTIFICATION_TEMPLATES.CONFIRMED, updated);
  if (validation.value.status === "cancelled") await queueAppointmentNotification(NOTIFICATION_TEMPLATES.CANCELLED, updated);
  return updated;
}

export async function cancelAppointmentForUser(user, id, reason) {
  return updateAppointmentForUser(user, id, { status: "cancelled", cancelReason: reason });
}

/** Slots the appointment could move to on `date` (its own current slot counts as free). */
export async function getRescheduleOptions(user, id, date) {
  const existing = await getWritableAppointment(user, id);
  if (!RESCHEDULABLE_STATUSES.includes(existing.status)) {
    throw ApiError.validation({ status: `A ${existing.status} appointment cannot be rescheduled.` });
  }
  return getAvailability({ doctorId: existing.doctorId, serviceId: existing.serviceId, date, excludeAppointmentId: id });
}

export async function rescheduleAppointmentForUser(user, id, input) {
  const validation = validateReschedule(input);
  if (!validation.valid) throw ApiError.validation(validation.errors);
  const { date, time } = validation.value;

  const existing = await getWritableAppointment(user, id);
  if (!RESCHEDULABLE_STATUSES.includes(existing.status)) {
    throw ApiError.validation({ status: `A ${existing.status} appointment cannot be rescheduled.` });
  }
  if (!isIsoDate(date) || parseIsoDate(date) < parseIsoDate(todayIso())) {
    throw ApiError.validation({ date: "Appointments cannot be moved into the past." });
  }
  if (existing.date === date && existing.time === time) {
    throw ApiError.validation({ time: "Choose a different date or time." });
  }

  const check = { doctorId: existing.doctorId, serviceId: existing.serviceId, date, time, excludeAppointmentId: id };
  if (!(await isSlotAvailable(check))) throw ApiError.slotUnavailable();

  const service = await getServiceById(existing.serviceId, { includeInactive: true });
  const updated = await appointments.rescheduleAppointment(id, {
    date,
    time,
    durationMinutes: service?.durationMinutes || existing.durationMinutes || 30,
    updatedBy: user.id,
    ensureAvailable: async (client) => {
      if (!(await isSlotAvailable(check, client))) throw ApiError.slotUnavailable();
    },
  });
  if (!updated) throw ApiError.notFound("Appointment not found.");
  await queueAppointmentNotification(NOTIFICATION_TEMPLATES.RESCHEDULED, updated);
  return updated;
}

export async function getDashboardSummary(scope, today) {
  const doctorScope = scope.all ? {} : { doctorId: scope.doctorId };
  const weekEnd = toIsoDate(addDays(parseIsoDate(today), 6));
  const [byStatus, todayCount, upcomingWeek, todayList] = await Promise.all([
    appointments.countAppointmentsByStatus(doctorScope),
    appointments.countAppointmentsOnDate(today, doctorScope),
    appointments.countAppointmentsInRange(today, weekEnd, doctorScope),
    appointments.listAppointments({ ...doctorScope, date: today, limit: 50 }),
  ]);
  return {
    byStatus,
    today: todayCount,
    upcomingWeek,
    todayAppointments: [...todayList.items].sort((a, b) => a.time.localeCompare(b.time)),
  };
}
