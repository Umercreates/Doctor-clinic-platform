import { created, readJson, withErrorHandling } from "@/server/http/response";
import { submitContactMessage } from "@/server/services/contactService";

export const dynamic = "force-dynamic";

export const POST = withErrorHandling(async (request) => {
  const body = await readJson(request);
  const result = await submitContactMessage(body);
  return created(result);
});
