import { ok, readJson, withErrorHandling } from "@/server/http/response";
import { requirePermission } from "@/server/auth/currentUser";
import { resetContentBlock, updateContentBlock } from "@/server/services/contentService";
import { revalidateContentBlock } from "@/server/revalidation";

/** PUT /api/v1/content/:key — admin: replace a content block (validated against its schema). */
export const PUT = withErrorHandling(async (request, { params }) => {
  const user = await requirePermission(request, "content:write");
  const { key } = await params;
  const body = await readJson(request);
  const block = await updateContentBlock(key, body, user.id);
  revalidateContentBlock(key);
  return ok(block);
});

/** DELETE /api/v1/content/:key — admin: restore the bundled default. */
export const DELETE = withErrorHandling(async (request, { params }) => {
  await requirePermission(request, "content:write");
  const { key } = await params;
  const block = await resetContentBlock(key);
  revalidateContentBlock(key);
  return ok(block);
});
