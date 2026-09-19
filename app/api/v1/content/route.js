import { ok, withErrorHandling } from "@/server/http/response";
import { requirePermission } from "@/server/auth/currentUser";
import { listContentForAdmin } from "@/server/services/contentService";

/** GET /api/v1/content — admin: editable content sections with current values. */
export const GET = withErrorHandling(async (request) => {
  await requirePermission(request, "content:write");
  const sections = await listContentForAdmin();
  return ok(sections);
});
