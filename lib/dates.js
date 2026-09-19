/**
 * Date / time helpers shared by the booking UI and the API.
 *
 * Conventions:
 *  - Calendar dates are ISO strings "YYYY-MM-DD" (no time component).
 *  - Clock times are 24h strings "HH:MM".
 *  - Both are interpreted in the clinic's local time zone. Full time-zone
 *    handling (storing timestamptz in PostgreSQL) is added in the backend phase.
 */

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isIsoDate(value) {
  if (typeof value !== "string" || !ISO_DATE_RE.test(value)) return false;
  const d = parseIsoDate(value);
  return !Number.isNaN(d.getTime()) && toIsoDate(d) === value;
}

export function isTimeString(value) {
  return typeof value === "string" && TIME_RE.test(value);
}

/** Parse "YYYY-MM-DD" into a local Date at midnight. */
export function parseIsoDate(value) {
  const [y, m, d] = String(value).split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

/** Format a Date as "YYYY-MM-DD" using local time. */
export function toIsoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayIso() {
  return toIsoDate(new Date());
}

export function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function addMonths(date, months) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

export function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** "HH:MM" -> minutes since midnight. */
export function timeToMinutes(time) {
  const [h, m] = String(time).split(":").map(Number);
  return h * 60 + m;
}

/** minutes since midnight -> "HH:MM". */
export function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** "13:30" -> "1:30 PM". */
export function formatTime12h(time) {
  if (!isTimeString(time)) return "";
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** "2026-03-14" -> "Saturday, March 14, 2026". */
export function formatLongDate(isoDate, options = {}) {
  if (!isIsoDate(isoDate)) return "";
  return parseIsoDate(isoDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    ...options,
  });
}

export function formatMonthYear(date) {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

/** Group a time into a part of day for slot lists. */
export function partOfDay(time) {
  const minutes = timeToMinutes(time);
  if (minutes < 12 * 60) return "morning";
  if (minutes < 17 * 60) return "afternoon";
  return "evening";
}

/**
 * Build a 6x7 grid of Dates for a month view (weeks start on Sunday).
 * Days from adjacent months are included so the grid is always complete.
 */
export function buildMonthGrid(monthDate) {
  const first = startOfMonth(monthDate);
  const offset = first.getDay();
  const gridStart = addDays(first, -offset);
  const cells = [];
  for (let i = 0; i < 42; i += 1) {
    cells.push(addDays(gridStart, i));
  }
  return cells;
}

/** "Sep 19, 2026, 4:05 PM" for timestamps (ISO string or Date). Empty string when missing. */
export function formatDateTime(value, options = {}) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", ...options });
}
