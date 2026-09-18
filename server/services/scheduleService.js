/**
 * Availability (weekly schedule blocks + blocked dates) use-cases.
 * Doctors may manage only their own schedule; admins manage everyone's.
 */
import { ApiError } from "@/server/http/errors";
import { validateScheduleBlock, validateScheduleException } from "@/lib/validation/availability";
import { isUuid } from "@/lib/validation/common";
import { canAccessDoctorRecord } from "@/server/auth/permissions";
import * as availability from "@/server/repositories/availabilityRepository";
import { getDoctorById } from "@/server/repositories/doctorsRepository";

export async function listAvailability(scope, { doctorId, from, to, includeInactive = false } = {}) {
  if (!scope.all && doctorId && doctorId !== scope.doctorId) throw ApiError.forbidden();
  const effectiveDoctorId = scope.all ? doctorId : scope.doctorId;
  const [blocks, exceptions] = await Promise.all([
    availability.listScheduleBlocks({ doctorId: effectiveDoctorId, includeInactive }),
    availability.listExceptions({ doctorId: effectiveDoctorId, from, to }),
  ]);
  return { blocks, exceptions };
}

export async function createScheduleBlock(user, input) {
  const validation = validateScheduleBlock(input);
  if (!validation.valid) throw ApiError.validation(validation.errors);
  const { doctorId } = validation.value;
  if (!canAccessDoctorRecord(user, "availability:write", doctorId)) throw ApiError.forbidden();
  if (!(await getDoctorById(doctorId, { includeInactive: true }))) {
    throw ApiError.validation({ doctorId: "Doctor does not exist." });
  }
  return availability.createScheduleBlock(validation.value);
}

export async function updateScheduleBlock(user, id, input) {
  if (!isUuid(id)) throw ApiError.badRequest("Schedule block identifier is not valid.");
  const existing = await availability.getScheduleBlock(id);
  if (!existing) throw ApiError.notFound("Schedule block not found.");
  if (!canAccessDoctorRecord(user, "availability:write", existing.doctorId)) throw ApiError.forbidden();
  const validation = validateScheduleBlock(
    { ...input, start: input.start ?? existing.start, end: input.end ?? existing.end },
    { partial: true },
  );
  if (!validation.valid) throw ApiError.validation(validation.errors);
  return availability.updateScheduleBlock(id, validation.value);
}

export async function deleteScheduleBlock(user, id) {
  if (!isUuid(id)) throw ApiError.badRequest("Schedule block identifier is not valid.");
  const existing = await availability.getScheduleBlock(id);
  if (!existing) throw ApiError.notFound("Schedule block not found.");
  if (!canAccessDoctorRecord(user, "availability:write", existing.doctorId)) throw ApiError.forbidden();
  await availability.deleteScheduleBlock(id);
  return { deleted: true };
}

export async function createException(user, input) {
  const validation = validateScheduleException(input);
  if (!validation.valid) throw ApiError.validation(validation.errors);
  const { doctorId } = validation.value;
  // Clinic-wide exceptions (no doctor) are admin-only.
  if (doctorId === null && user.role !== "admin") throw ApiError.forbidden();
  if (doctorId && !canAccessDoctorRecord(user, "availability:write", doctorId)) throw ApiError.forbidden();
  return availability.createException({ ...validation.value, createdBy: user.id });
}

async function getWritableException(user, id) {
  if (!isUuid(id)) throw ApiError.badRequest("Exception identifier is not valid.");
  const existing = await availability.getException(id);
  if (!existing) throw ApiError.notFound("Exception not found.");
  if (existing.doctorId === null && user.role !== "admin") throw ApiError.forbidden();
  if (existing.doctorId && !canAccessDoctorRecord(user, "availability:write", existing.doctorId)) throw ApiError.forbidden();
  return existing;
}

export async function updateException(user, id, input) {
  const existing = await getWritableException(user, id);
  const merged = {
    doctorId: existing.doctorId,
    date: input.date ?? existing.date,
    start: input.start === undefined ? existing.start : input.start,
    end: input.end === undefined ? existing.end : input.end,
    isAvailable: input.isAvailable ?? existing.isAvailable,
    reason: input.reason === undefined ? existing.reason : input.reason,
  };
  const validation = validateScheduleException(merged);
  if (!validation.valid) throw ApiError.validation(validation.errors);
  const patch = { ...validation.value };
  delete patch.doctorId;
  return availability.updateException(id, patch);
}

export async function deleteException(user, id) {
  const existing = await getWritableException(user, id);
  await availability.deleteException(existing.id);
  return { deleted: true };
}
