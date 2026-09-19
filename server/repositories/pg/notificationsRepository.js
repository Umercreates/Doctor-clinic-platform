/**
 * Notifications outbox — PostgreSQL implementation (`notifications` table).
 */
import { queryOne, queryRows } from "@/lib/database";

export async function queueNotification({ channel, template, recipientEmail = null, recipientUser = null, appointmentId = null, payload = {} }) {
  const row = await queryOne(
    `INSERT INTO notifications (channel, status, template, recipient_email, recipient_user, appointment_id, payload)
     VALUES ($1, 'queued', $2, $3, $4, $5, $6::jsonb)
     RETURNING id, channel, status, template, created_at`,
    [channel, template, recipientEmail, recipientUser, appointmentId, JSON.stringify(payload)],
  );
  return { id: row.id, channel: row.channel, status: row.status, template: row.template, createdAt: row.created_at };
}

/** Queued notifications, oldest first (for a future delivery worker). */
export async function listQueuedNotifications({ limit = 100 } = {}) {
  const rows = await queryRows("SELECT id, channel, template, recipient_email, appointment_id, payload, created_at FROM notifications WHERE status = 'queued' ORDER BY created_at LIMIT $1", [Math.min(500, Math.max(1, limit))]);
  return rows.map((r) => ({ id: r.id, channel: r.channel, template: r.template, recipientEmail: r.recipient_email, appointmentId: r.appointment_id, payload: r.payload, createdAt: r.created_at }));
}
