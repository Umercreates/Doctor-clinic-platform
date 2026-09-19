/**
 * FAQ management use-cases (admin). Public reads go straight to the repository.
 */
import { ApiError } from "@/server/http/errors";
import { validateFaqInput } from "@/lib/validation/faq";
import { isUuid } from "@/lib/validation/common";
import * as faqs from "@/server/repositories/faqsRepository";

export async function getFaqOrThrow(id) {
  if (!isUuid(id)) throw ApiError.badRequest("FAQ identifier is not valid.");
  const faq = await faqs.getFaqById(id);
  if (!faq) throw ApiError.notFound("FAQ not found.");
  return faq;
}

export async function createFaq(input) {
  const validation = validateFaqInput(input);
  if (!validation.valid) throw ApiError.validation(validation.errors);
  if (await faqs.getFaqByKey(validation.value.key)) {
    throw ApiError.validation({ key: "Another FAQ already uses this key." });
  }
  return faqs.createFaq({ category: "general", featured: false, isActive: true, sortOrder: 0, ...validation.value });
}

export async function updateFaq(id, input) {
  const existing = await getFaqOrThrow(id);
  const validation = validateFaqInput(input, { partial: true });
  if (!validation.valid) throw ApiError.validation(validation.errors);
  if (!Object.keys(validation.value).length) throw ApiError.validation({ body: "Nothing to update." });
  if (validation.value.key && validation.value.key !== existing.key) {
    const clash = await faqs.getFaqByKey(validation.value.key);
    if (clash && clash.uuid !== existing.uuid) throw ApiError.validation({ key: "Another FAQ already uses this key." });
  }
  return faqs.updateFaq(id, validation.value);
}

export async function deleteFaq(id) {
  await getFaqOrThrow(id);
  await faqs.deleteFaq(id);
  return { id, deleted: true };
}
