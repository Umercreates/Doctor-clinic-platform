/**
 * Contact form use-case. Messages are validated and stored in
 * `contact_messages` (in memory without a database). Email notification to the
 * clinic is not configured; the UI says so honestly.
 */
import { ApiError } from "@/server/http/errors";
import { validateContactMessage } from "@/lib/validation/contact";
import { createContactMessage } from "@/server/repositories/contactRepository";
import { log } from "@/server/log";

export async function submitContactMessage(input) {
  const validation = validateContactMessage(input);
  if (!validation.valid) {
    throw ApiError.validation(validation.errors);
  }

  const message = await createContactMessage({ ...validation.value, source: "website" });
  // Reference and topic only: sender details stay in the database.
  log.info("contact.received", { reference: message.reference, topic: message.topic });

  return { reference: message.reference, receivedAt: message.createdAt };
}
