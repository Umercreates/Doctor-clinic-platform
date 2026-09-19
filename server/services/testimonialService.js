/**
 * Testimonial management use-cases (admin).
 * Public visibility requires both `isPublished` and `consentGiven`.
 */
import { ApiError } from "@/server/http/errors";
import { validateTestimonialInput } from "@/lib/validation/testimonial";
import { isUuid } from "@/lib/validation/common";
import * as testimonials from "@/server/repositories/testimonialsRepository";
import { getDoctorById } from "@/server/repositories/doctorsRepository";

export async function getTestimonialOrThrow(id) {
  if (!isUuid(id)) throw ApiError.badRequest("Testimonial identifier is not valid.");
  const testimonial = await testimonials.getTestimonialById(id);
  if (!testimonial) throw ApiError.notFound("Testimonial not found.");
  return testimonial;
}

async function assertDoctor(doctorId) {
  if (!doctorId) return;
  const doctor = await getDoctorById(doctorId, { includeInactive: true });
  if (!doctor) throw ApiError.validation({ doctorId: "Doctor does not exist." });
}

export async function createTestimonial(input) {
  const validation = validateTestimonialInput(input);
  if (!validation.valid) throw ApiError.validation(validation.errors);
  await assertDoctor(validation.value.doctorId);
  return testimonials.createTestimonial({ isPublished: false, consentGiven: false, sortOrder: 0, rating: null, doctorId: null, ...validation.value });
}

export async function updateTestimonial(id, input) {
  await getTestimonialOrThrow(id);
  const validation = validateTestimonialInput(input, { partial: true });
  if (!validation.valid) throw ApiError.validation(validation.errors);
  if (!Object.keys(validation.value).length) throw ApiError.validation({ body: "Nothing to update." });
  await assertDoctor(validation.value.doctorId);
  return testimonials.updateTestimonial(id, validation.value);
}

export async function deleteTestimonial(id) {
  await getTestimonialOrThrow(id);
  await testimonials.deleteTestimonial(id);
  return { id, deleted: true };
}
