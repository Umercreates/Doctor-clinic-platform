/**
 * Contact messages repository (in-memory until PostgreSQL is connected).
 */
import { getMemoryStore } from "@/lib/database/memoryStore";
import { generateReference } from "@/lib/utils";

export async function createContactMessage(input) {
  const store = getMemoryStore();
  const message = {
    id: `msg_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    reference: generateReference("MSG"),
    status: "new",
    createdAt: new Date().toISOString(),
    ...input,
  };
  store.contactMessages.push(message);
  return message;
}
