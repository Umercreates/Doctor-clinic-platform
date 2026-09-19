/**
 * appointmentsRepository facade. Chooses the PostgreSQL implementation when DATABASE_URL is
 * configured, otherwise the bundled demo implementation. Callers import from
 * this module only, so the data source can change without touching them.
 */
import { isDatabaseConfigured } from "@/lib/database";
import * as pg from "./pg/appointmentsRepository";
import * as demo from "./demo/appointmentsRepository";

const impl = isDatabaseConfigured() ? pg : demo;

export const APPOINTMENT_STATUS = pg.APPOINTMENT_STATUS;
export const APPOINTMENT_STATUSES = pg.APPOINTMENT_STATUSES;
export const BLOCKING_STATUSES = pg.BLOCKING_STATUSES;

export const listBookedTimes = (...args) => impl.listBookedTimes(...args);
export const createAppointment = (...args) => impl.createAppointment(...args);
export const bookAppointment = (...args) => impl.bookAppointment(...args);
export const getAppointmentById = (...args) => impl.getAppointmentById(...args);
export const getAppointmentByReference = (...args) => impl.getAppointmentByReference(...args);
export const listAppointments = (...args) => impl.listAppointments(...args);
export const countAppointmentsByStatus = (...args) => impl.countAppointmentsByStatus(...args);
export const countAppointmentsOnDate = (...args) => impl.countAppointmentsOnDate(...args);
export const countAppointmentsInRange = (...args) => impl.countAppointmentsInRange(...args);
export const updateAppointment = (...args) => impl.updateAppointment(...args);
export const listBookedTimesInRange = (...args) => impl.listBookedTimesInRange(...args);
export const rescheduleAppointment = (...args) => impl.rescheduleAppointment(...args);
