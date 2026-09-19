/**
 * Notification boundary (outbox pattern).
 *
 * No email or SMS provider is configured in this project, and nothing here
 * sends anything. Appointment events are recorded as `queued` rows in the
 * `notifications` table so a future delivery worker (email provider, SMS
 * gateway) can pick them up without changing the booking code. Until such a
 * worker exists the rows simply stay queued, and every user-facing message
 * says honestly that no email has been sent.
 *
 * Payloads carry the minimum needed to render a message later (reference,
 * date, time, doctor and service names). No patient notes are stored here.
 * Queueing is best-effort: a failure is logged and never breaks the booking.
 */
import { isDatabaseConfigured } from "@/lib/database";
import * as notifications from "@/server/repositories/notificationsRepository";
import { log } from "@/server/log";

export const NOTIFICATION_TEMPLATES = Object.freeze({
  REQUESTED: "appointment.requested",
  CONFIRMED: "appointment.confirmed",
  RESCHEDULED: "appointment.rescheduled",
  CANCELLED: "appointment.cancelled",
});

/** True when a delivery provider is wired up. Always false in this release. */
export function isDeliveryConfigured() {
  return false;
}

function payloadFor(appointment) {
  return {
    reference: appointment.reference,
    date: appointment.date,
    time: appointment.time,
    endTime: appointment.endTime || null,
    doctorName: appointment.doctor?.name || null,
    serviceName: appointment.service?.name || null,
  };
}

/**
 * Record that a patient should be told about an appointment event.
 * @param {string} template  one of NOTIFICATION_TEMPLATES
 * @param {object} appointment  needs `id`, `reference`, `date`, `time`, `patient.email`
 */
export async function queueAppointmentNotification(template, appointment) {
  if (!isDatabaseConfigured() || !appointment?.id || !appointment.patient?.email) return null;
  try {
    return await notifications.queueNotification({
      channel: "email",
      template,
      recipientEmail: appointment.patient.email,
      appointmentId: appointment.id,
      payload: payloadFor(appointment),
    });
  } catch (error) {
    log.error("notification.queue_failed", { template, reference: appointment.reference, error });
    return null;
  }
}
