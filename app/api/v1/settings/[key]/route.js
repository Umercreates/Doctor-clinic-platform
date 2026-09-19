import { ok, readJson, withErrorHandling } from "@/server/http/response";
import { requirePermission } from "@/server/auth/currentUser";
import { updateSetting } from "@/server/services/contentService";
import { revalidateSettings } from "@/server/revalidation";

/** PUT /api/v1/settings/:key — admin: replace one settings group (validated). */
export const PUT = withErrorHandling(async (request, { params }) => {
  const user = await requirePermission(request, "settings:write");
  const { key } = await params;
  const body = await readJson(request);
  const setting = await updateSetting(key, body, user.id);
  revalidateSettings(key);
  return ok(setting);
});
