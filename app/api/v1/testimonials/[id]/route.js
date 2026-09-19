import { ok, readJson, withErrorHandling } from "@/server/http/response";
import { requirePermission } from "@/server/auth/currentUser";
import { deleteTestimonial, getTestimonialOrThrow, updateTestimonial } from "@/server/services/testimonialService";
import { revalidateTestimonials } from "@/server/revalidation";

/** GET /api/v1/testimonials/:id — admin. */
export const GET = withErrorHandling(async (request, { params }) => {
  await requirePermission(request, "testimonials:write");
  const { id } = await params;
  return ok(await getTestimonialOrThrow(id));
});

async function update(request, { params }) {
  await requirePermission(request, "testimonials:write");
  const { id } = await params;
  const body = await readJson(request);
  const testimonial = await updateTestimonial(id, body);
  revalidateTestimonials();
  return ok(testimonial);
}

/** PATCH / PUT /api/v1/testimonials/:id — admin. */
export const PATCH = withErrorHandling(update);
export const PUT = withErrorHandling(update);

/** DELETE /api/v1/testimonials/:id — admin: permanently remove. */
export const DELETE = withErrorHandling(async (request, { params }) => {
  await requirePermission(request, "testimonials:write");
  const { id } = await params;
  const result = await deleteTestimonial(id);
  revalidateTestimonials();
  return ok(result);
});
