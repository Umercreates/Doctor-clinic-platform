import { ok, readJson, withErrorHandling } from "@/server/http/response";
import { requireUser } from "@/server/auth/currentUser";
import { deleteScheduleBlock, updateScheduleBlock } from "@/server/services/scheduleService";
import { revalidateSchedule } from "@/server/revalidation";

export const dynamic = "force-dynamic";

/** PATCH /api/v1/availability/:id — update a weekly block. */
export const PATCH = withErrorHandling(async (request, { params }) => {
  const user = await requireUser(request);
  const { id } = await params;
  const body = await readJson(request);
  const block = await updateScheduleBlock(user, id, body);
  revalidateSchedule();
  return ok(block);
});

/** DELETE /api/v1/availability/:id — remove a weekly block. */
export const DELETE = withErrorHandling(async (request, { params }) => {
  const user = await requireUser(request);
  const { id } = await params;
  const result = await deleteScheduleBlock(user, id);
  revalidateSchedule();
  return ok(result);
});
