import { created, ok, readJson, withErrorHandling } from "@/server/http/response";
import { requirePermission } from "@/server/auth/currentUser";
import { listFaqs, listFaqCategories } from "@/server/repositories/faqsRepository";
import { createFaq } from "@/server/services/faqService";
import { revalidateFaqs } from "@/server/revalidation";

/** GET /api/v1/faqs — public active FAQs (?featured=1). Admins may pass ?includeInactive=1. */
export const GET = withErrorHandling(async (request) => {
  const { searchParams } = new URL(request.url);
  const featuredOnly = searchParams.get("featured") === "1";
  let includeInactive = false;
  if (searchParams.get("includeInactive") === "1") {
    await requirePermission(request, "faqs:write");
    includeInactive = true;
  }
  const [faqs, categories] = await Promise.all([listFaqs({ featuredOnly, includeInactive }), listFaqCategories()]);
  return ok(faqs, { meta: { total: faqs.length, categories } });
});

/** POST /api/v1/faqs — admin: create an FAQ. */
export const POST = withErrorHandling(async (request) => {
  await requirePermission(request, "faqs:write");
  const body = await readJson(request);
  const faq = await createFaq(body);
  revalidateFaqs();
  return created(faq);
});
