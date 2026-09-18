/**
 * availabilityRepository facade. Chooses the PostgreSQL implementation when DATABASE_URL is
 * configured, otherwise the bundled demo implementation. Callers import from
 * this module only, so the data source can change without touching them.
 */
import { isDatabaseConfigured } from "@/lib/database";
import * as pg from "./pg/availabilityRepository";
import * as demo from "./demo/availabilityRepository";

const impl = isDatabaseConfigured() ? pg : demo;

export const listScheduleBlocks = (...args) => impl.listScheduleBlocks(...args);
export const getScheduleBlock = (...args) => impl.getScheduleBlock(...args);
export const createScheduleBlock = (...args) => impl.createScheduleBlock(...args);
export const updateScheduleBlock = (...args) => impl.updateScheduleBlock(...args);
export const deleteScheduleBlock = (...args) => impl.deleteScheduleBlock(...args);
export const listExceptions = (...args) => impl.listExceptions(...args);
export const createException = (...args) => impl.createException(...args);
export const deleteException = (...args) => impl.deleteException(...args);
export const getException = (...args) => impl.getException(...args);
export const updateException = (...args) => impl.updateException(...args);
