import { timeToMinutes } from "@/lib/dates";
import { APPOINTMENT_LIMITS } from "@/lib/validation/appointment";

/** Schedule blocks for a doctor on a weekday (0 = Sunday). */
export function getScheduleBlocks(doctor, weekday) {
  const entry = doctor?.schedule?.find((s) => s.day === weekday);
  return entry ? entry.blocks : [];
}

/**
 * True if at least one slot of `slotMinutes` can still start on `date` for the
 * doctor, honouring the same-day lead time. Used by the calendar to avoid
 * offering days the availability API would return empty.
 */
export function hasBookableTime(doctor, date, slotMinutes = APPOINTMENT_LIMITS.defaultSlotMinutes, now = new Date()) {
  const blocks = getScheduleBlocks(doctor, date.getDay());
  if (!blocks.length) return false;

  const isToday =
    date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
  if (!isToday) return true;

  const earliestStart = now.getHours() * 60 + now.getMinutes() + APPOINTMENT_LIMITS.minLeadMinutes;
  return blocks.some((block) => {
    const start = timeToMinutes(block.start);
    const end = timeToMinutes(block.end);
    // First grid-aligned start at or after the lead time.
    const step = APPOINTMENT_LIMITS.slotStepMinutes;
    const firstStart = Math.max(start, Math.ceil((earliestStart - start) / step) * step + start);
    return firstStart + slotMinutes <= end;
  });
}
