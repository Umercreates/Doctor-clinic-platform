import { created, readJson, withErrorHandling } from "@/server/http/response";
import { requireUser } from "@/server/auth/currentUser";
import { createException } from "@/server/services/scheduleService";

export const dynamic = "force-dynamic";

/** POST /api/v1/availability/exceptions — blocked date/time or extra availability. */
export const POST = withErrorHandling(async (request) => {
  const user = await requireUser(request);
  const body = await readJson(request);
  return created(await createException(user, body));
});
