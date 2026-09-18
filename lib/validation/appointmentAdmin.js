import { isIsoDate, isTimeString } from "@/lib/dates";
import { isUuid, maxLength, normalizeString, oneOf } from "./common";

export const APPOINTMENT_STATUS_VALUES = ["pending", "confirmed", "rescheduled", "cancelled", "completed", "no_show"];

/** Allowed status transitions for dashboard updates. */
const TRANSITIONS = {
  pending: ["confirmed", "cancelled", "rescheduled"],
  confirmed: ["completed", "cancelled", "no_show", "rescheduled"],
  rescheduled: ["confirmed", "completed", "cancelled", "no_show", "rescheduled"],
  cancelled: [],
  completed: [],
  no_show: [],
};

/** Statuses from which an appointment may be moved to a new date/time. */
export const RESCHEDULABLE_STATUSES = ["pending", "confirmed", "rescheduled"];
/** Statuses that still hold a slot. */
export const ACTIVE_STATUSES = ["pending", "confirmed", "rescheduled"];

export function canTransition(from, to) {
  return from === to || (TRANSITIONS[from] || []).includes(to);
}

/** Validate a dashboard appointment patch: status and/or notes. */
export function validateAppointmentPatch(input = {}) {
  const errors = {};
  const value = {};
  if (input.status !== undefined) {
    const e = oneOf(input.status, APPOINTMENT_STATUS_VALUES, "Status");
    if (e) errors.status = e;
    else value.status = input.status;
  }
  if (input.internalNotes !== undefined) {
    const e = maxLength(input.internalNotes, 2000, "Internal notes");
    if (e) errors.internalNotes = e;
    else value.internalNotes = normalizeString(input.internalNotes) || null;
  }
  if (input.cancelReason !== undefined) {
    const e = maxLength(input.cancelReason, 300, "Cancel reason");
    if (e) errors.cancelReason = e;
    else value.cancelReason = normalizeString(input.cancelReason) || null;
  }
  if (!Object.keys(value).length && !Object.keys(errors).length) errors.body = "Nothing to update.";
  return { valid: Object.keys(errors).length === 0, errors, value };
}

/** Validate a reschedule request: { date, time }. */
export function validateReschedule(input = {}) {
  const errors = {};
  if (!isIsoDate(input.date)) errors.date = "Please choose a valid date.";
  if (!isTimeString(input.time)) errors.time = "Please choose a valid time.";
  return { valid: Object.keys(errors).length === 0, errors, value: { date: input.date, time: input.time } };
}

/** Validate list filters from query params. */
export function validateAppointmentFilters(params) {
  const errors = {};
  const value = {};
  const status = params.get("status");
  if (status) {
    const e = oneOf(status, APPOINTMENT_STATUS_VALUES, "Status");
    if (e) errors.status = e;
    else value.status = status;
  }
  for (const key of ["date", "from", "to"]) {
    const v = params.get(key);
    if (v) {
      if (!isIsoDate(v)) errors[key] = `${key} must be YYYY-MM-DD.`;
      else value[key] = v;
    }
  }
  for (const key of ["doctorId", "patientId"]) {
    const v = params.get(key);
    if (v) {
      if (!isUuid(v)) errors[key] = `${key} is not valid.`;
      else value[key] = v;
    }
  }
  const search = normalizeString(params.get("search"));
  if (search) value.search = search.slice(0, 100);
  return { valid: Object.keys(errors).length === 0, errors, value };
}
