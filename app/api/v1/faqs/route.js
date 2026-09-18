import { ok, withErrorHandling } from "@/server/http/response";
import { listFaqs, listFaqCategories } from "@/server/repositories/faqsRepository";

export const GET = withErrorHandling(async (request) => {
  const { searchParams } = new URL(request.url);
  const featuredOnly = searchParams.get("featured") === "1";
  const [faqs, categories] = await Promise.all([listFaqs({ featuredOnly }), listFaqCategories()]);
  return ok(faqs, { meta: { total: faqs.length, categories } });
});
