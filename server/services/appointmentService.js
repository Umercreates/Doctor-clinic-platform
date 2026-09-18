/**
 * Appointment booking use-cases.
 *
 * Demo phase: validates the request, checks the slot against the in-memory
 * store, and records a pending appointment. The backend phase replaces the
 * repository with PostgreSQL and adds notifications; the public interface of
 * this module stays the same.
 */
import { ApiError } from "@/server/http/errors";
import { validateAppointmentRequest } from "@/lib/validation/appointment";
import { getDoctorById } from "@/server/repositories/doctorsRepository";
import { getServiceById } from "@/server/repositories/servicesRepository";
import { createAppointment } from "@/server/repositories/appointmentsRepository";
import { isSlotAvailable } from "@/server/services/availabilityService";

/** Shape returned to the client after a booking. Never exposes internal fields. */
function toPublicAppointment(appointment, doctor, service) {
  return {
    reference: appointment.reference,
    status: appointment.status,
    date: appointment.date,
    time: appointment.time,
    durationMinutes: appointment.durationMinutes,
    doctor: { id: doctor.id, slug: doctor.slug, name: doctor.name, role: doctor.role },
    service: { id: service.id, slug: service.slug, name: service.name },
    patient: {
      fullName: appointment.patient.fullName,
      email: appointment.patient.email,
      phone: appointment.patient.phone,
      notes: appointment.patient.notes,
    },
    createdAt: appointment.createdAt,
    isDemo: true,
  };
}

export async function bookAppointment(input) {
  const validation = validateAppointmentRequest(input);
  if (!validation.valid) {
    throw ApiError.validation(validation.errors);
  }

  const { doctorId, serviceId, date, time, patient } = validation.value;

  const doctor = await getDoctorById(doctorId);
  if (!doctor) throw ApiError.validation({ doctorId: "Please choose a valid doctor." });

  const service = await getServiceById(serviceId);
  if (!service) throw ApiError.validation({ serviceId: "Please choose a valid service." });

  if (!doctor.serviceIds.includes(service.id)) {
    throw ApiError.validation({ serviceId: `${doctor.name} does not offer ${service.name}.` });
  }

  const available = await isSlotAvailable({ doctorId, serviceId, date, time });
  if (!available) {
    throw ApiError.conflict(
      "That time is no longer available. Please choose another time.",
      { time: "This time slot is no longer available." },
    );
  }

  const appointment = await createAppointment({
    doctorId,
    serviceId,
    date,
    time,
    durationMinutes: service.durationMinutes,
    patient,
    source: "website",
  });

  return toPublicAppointment(appointment, doctor, service);
}
