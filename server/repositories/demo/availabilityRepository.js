/**
 * Availability repository — demo implementation reading the bundled schedules.
 */
import { doctors } from "@/data/doctors";
import { notAvailable } from "./notAvailable";

export async function listScheduleBlocks({ doctorId } = {}) {
  return doctors
    .filter((d) => !doctorId || d.id === doctorId)
    .flatMap((d) =>
      d.schedule.flatMap((day) =>
        day.blocks.map((b, i) => ({
          id: `${d.id}-${day.day}-${i}`,
          doctorId: d.id,
          weekday: day.day,
          start: b.start,
          end: b.end,
          isActive: true,
        })),
      ),
    );
}

export async function listExceptions() {
  return [];
}

export const getScheduleBlock = notAvailable;
export const createScheduleBlock = notAvailable;
export const updateScheduleBlock = notAvailable;
export const deleteScheduleBlock = notAvailable;
export const createException = notAvailable;
export const deleteException = notAvailable;
export const getException = notAvailable;
export const updateException = notAvailable;
