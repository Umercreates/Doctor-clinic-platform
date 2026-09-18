import { isIsoDate, isTimeString, timeToMinutes } from "@/lib/dates";
import { boolean, integer, isUuid, maxLength, normalizeString } from "./common";

/** Weekly schedule block: { doctorId, weekday, start, end } */
export function validateScheduleBlock(input = {}, { partial = false } = {}) {
  const errors = {};
  const value = {};
  const has = (key) => input[key] !== undefined;
  const need = (key) => !partial || has(key);

  if (need("doctorId") && !partial) {
    if (!isUuid(input.doctorId)) errors.doctorId = "Doctor identifier is not valid.";
    else value.doctorId = input.doctorId;
  }
  if (need("weekday")) {
    const e = integer(input.weekday, { min: 0, max: 6, label: "Weekday" });
    if (e) errors.weekday = e;
    else value.weekday = Number(input.weekday);
  }
  if (need("start")) {
    if (!isTimeString(input.start)) errors.start = "Start time must be HH:MM.";
    else value.start = input.start;
  }
  if (need("end")) {
    if (!isTimeString(input.end)) errors.end = "End time must be HH:MM.";
    else value.end = input.end;
  }
  if (value.start && value.end && timeToMinutes(value.end) <= timeToMinutes(value.start)) {
    errors.end = "End time must be after the start time.";
  }
  if (has("isActive")) {
    const e = boolean(input.isActive, "isActive");
    if (e) errors.isActive = e;
    else value.isActive = input.isActive;
  }
  return { valid: Object.keys(errors).length === 0, errors, value };
}

/** Blocked date / extra availability: { doctorId?, date, start?, end?, isAvailable?, reason? } */
export function validateScheduleException(input = {}) {
  const errors = {};
  const value = { doctorId: null, start: null, end: null, isAvailable: false, reason: null };

  if (input.doctorId !== undefined && input.doctorId !== null) {
    if (!isUuid(input.doctorId)) errors.doctorId = "Doctor identifier is not valid.";
    else value.doctorId = input.doctorId;
  }
  if (!isIsoDate(input.date)) errors.date = "Date must be YYYY-MM-DD.";
  else value.date = input.date;

  const hasStart = input.start !== undefined && input.start !== null;
  const hasEnd = input.end !== undefined && input.end !== null;
  if (hasStart !== hasEnd) errors.end = "Provide both a start and an end time, or neither for a whole day.";
  if (hasStart && !isTimeString(input.start)) errors.start = "Start time must be HH:MM.";
  if (hasEnd && !isTimeString(input.end)) errors.end = "End time must be HH:MM.";
  if (hasStart && hasEnd && !errors.start && !errors.end) {
    if (timeToMinutes(input.end) <= timeToMinutes(input.start)) errors.end = "End time must be after the start time.";
    else Object.assign(value, { start: input.start, end: input.end });
  }
  if (input.isAvailable !== undefined) {
    const e = boolean(input.isAvailable, "isAvailable");
    if (e) errors.isAvailable = e;
    else value.isAvailable = input.isAvailable;
  }
  if (input.reason !== undefined) {
    const e = maxLength(input.reason, 200, "Reason");
    if (e) errors.reason = e;
    else value.reason = normalizeString(input.reason) || null;
  }
  return { valid: Object.keys(errors).length === 0, errors, value };
}
