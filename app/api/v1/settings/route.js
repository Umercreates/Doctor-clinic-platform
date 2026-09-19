import { ok, withErrorHandling } from "@/server/http/response";
import { requirePermission } from "@/server/auth/currentUser";
import { listSettingsForAdmin } from "@/server/services/contentService";

/**
 * GET /api/v1/settings — admin: editable website settings.
 * Only public-facing clinic information lives here; environment secrets are
 * never read or returned by this endpoint.
 */
export const GET = withErrorHandling(async (request) => {
  await requirePermission(request, "settings:write");
  const settings = await listSettingsForAdmin();
  return ok(settings);
});
