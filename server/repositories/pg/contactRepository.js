/**
 * Contact messages repository — PostgreSQL implementation.
 */
import { queryOne } from "@/lib/database";
import { generateReference } from "@/lib/utils";

export async function createContactMessage(input) {
  const row = await queryOne(
    `INSERT INTO contact_messages (reference, full_name, email, phone, topic, message, source)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, reference, status, created_at`,
    [generateReference("MSG"), input.fullName, input.email, input.phone || null, input.topic, input.message, input.source || "website"],
  );
  return { id: row.id, reference: row.reference, status: row.status, createdAt: row.created_at, email: input.email, topic: input.topic };
}
