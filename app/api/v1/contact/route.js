import { created, readJson, withErrorHandling } from "@/server/http/response";
import { submitContactMessage } from "@/server/services/contactService";
import { enforceIpRateLimit } from "@/server/security/rateLimit";

export const dynamic = "force-dynamic";

/** POST /api/v1/contact — public contact form (rate limited per IP). */
export const POST = withErrorHandling(async (request) => {
  await enforceIpRateLimit(request, "contact:ip", { message: "Too many messages were sent from your connection. Please try again later or call the clinic." });
  const body = await readJson(request);
  const result = await submitContactMessage(body);
  return created(result);
});
