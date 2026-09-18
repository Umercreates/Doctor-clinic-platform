import { ok, readJson, withErrorHandling } from "@/server/http/response";
import { requireUser } from "@/server/auth/currentUser";
import { deleteException, updateException } from "@/server/services/scheduleService";

export const dynamic = "force-dynamic";

/** PATCH /api/v1/availability/exceptions/:id — edit a blocked date / extra window. */
export const PATCH = withErrorHandling(async (request, { params }) => {
  const user = await requireUser(request);
  const { id } = await params;
  const body = await readJson(request);
  return ok(await updateException(user, id, body));
});

/** DELETE /api/v1/availability/exceptions/:id */
export const DELETE = withErrorHandling(async (request, { params }) => {
  const user = await requireUser(request);
  const { id } = await params;
  return ok(await deleteException(user, id));
});
