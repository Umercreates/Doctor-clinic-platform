import { ok, withErrorHandling } from "@/server/http/response";
import { ApiError } from "@/server/http/errors";
import { getRequestUser } from "@/server/auth/currentUser";
import { toPublicUser } from "@/server/services/authService";

export const dynamic = "force-dynamic";

/** GET /api/v1/auth/me — safe profile of the signed-in user (id, name, email, role). */
export const GET = withErrorHandling(async (request) => {
  const user = await getRequestUser(request);
  if (!user) throw ApiError.unauthorized();
  return ok({ user: toPublicUser(user) }, { headers: { "Cache-Control": "no-store" } });
});
