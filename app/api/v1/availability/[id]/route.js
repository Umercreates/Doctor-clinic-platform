import { ok, readJson, withErrorHandling } from "@/server/http/response";
import { requireUser } from "@/server/auth/currentUser";
import { deleteScheduleBlock, updateScheduleBlock } from "@/server/services/scheduleService";

export const dynamic = "force-dynamic";

/** PATCH /api/v1/availability/:id — update a weekly block. */
export const PATCH = withErrorHandling(async (request, { params }) => {
  const user = await requireUser(request);
  const { id } = await params;
  const body = await readJson(request);
  return ok(await updateScheduleBlock(user, id, body));
});

/** DELETE /api/v1/availability/:id — remove a weekly block. */
export const DELETE = withErrorHandling(async (request, { params }) => {
  const user = await requireUser(request);
  const { id } = await params;
  return ok(await deleteScheduleBlock(user, id));
});
