import { created, ok, readJson, withErrorHandling } from "@/server/http/response";
import { requirePermission } from "@/server/auth/currentUser";
import { listTestimonials } from "@/server/repositories/testimonialsRepository";
import { createTestimonial } from "@/server/services/testimonialService";
import { revalidateTestimonials } from "@/server/revalidation";

/** GET /api/v1/testimonials — public (published + consented). Admins may pass ?all=1. */
export const GET = withErrorHandling(async (request) => {
  const { searchParams } = new URL(request.url);
  let publicOnly = true;
  if (searchParams.get("all") === "1") {
    await requirePermission(request, "testimonials:write");
    publicOnly = false;
  }
  const testimonials = await listTestimonials({ publicOnly });
  return ok(testimonials, { meta: { total: testimonials.length } });
});

/** POST /api/v1/testimonials — admin: add a testimonial (unpublished until consent is recorded). */
export const POST = withErrorHandling(async (request) => {
  await requirePermission(request, "testimonials:write");
  const body = await readJson(request);
  const testimonial = await createTestimonial(body);
  revalidateTestimonials();
  return created(testimonial);
});
