import { ok, readJson, withErrorHandling } from "@/server/http/response";
import { requirePermission } from "@/server/auth/currentUser";
import { deleteFaq, getFaqOrThrow, updateFaq } from "@/server/services/faqService";
import { revalidateFaqs } from "@/server/revalidation";

/** GET /api/v1/faqs/:id — admin: one FAQ (including inactive). */
export const GET = withErrorHandling(async (request, { params }) => {
  await requirePermission(request, "faqs:write");
  const { id } = await params;
  return ok(await getFaqOrThrow(id));
});

async function update(request, { params }) {
  await requirePermission(request, "faqs:write");
  const { id } = await params;
  const body = await readJson(request);
  const faq = await updateFaq(id, body);
  revalidateFaqs();
  return ok(faq);
}

/** PATCH / PUT /api/v1/faqs/:id — admin: edit question, answer, category, flags, order. */
export const PATCH = withErrorHandling(update);
export const PUT = withErrorHandling(update);

/** DELETE /api/v1/faqs/:id — admin: permanently remove an FAQ. */
export const DELETE = withErrorHandling(async (request, { params }) => {
  await requirePermission(request, "faqs:write");
  const { id } = await params;
  const result = await deleteFaq(id);
  revalidateFaqs();
  return ok(result);
});
