/**
 * Contact form use-case. Demo phase stores the message in memory and logs it;
 * the backend phase persists it and notifies the clinic.
 */
import { ApiError } from "@/server/http/errors";
import { validateContactMessage } from "@/lib/validation/contact";
import { createContactMessage } from "@/server/repositories/contactRepository";

export async function submitContactMessage(input) {
  const validation = validateContactMessage(input);
  if (!validation.valid) {
    throw ApiError.validation(validation.errors);
  }

  const message = await createContactMessage({ ...validation.value, source: "website" });

  if (process.env.NODE_ENV !== "production") {
    console.info(`[contact] New message ${message.reference} from ${message.email} (${message.topic})`);
  }

  return { reference: message.reference, receivedAt: message.createdAt };
}
