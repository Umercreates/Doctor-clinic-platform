/**
 * clinicRepository facade. Chooses the PostgreSQL implementation when DATABASE_URL is
 * configured, otherwise the bundled demo implementation. Callers import from
 * this module only, so the data source can change without touching them.
 */
import { isDatabaseConfigured } from "@/lib/database";
import * as pg from "./pg/clinicRepository";
import * as demo from "./demo/clinicRepository";

const impl = isDatabaseConfigured() ? pg : demo;

export const getClinic = (...args) => impl.getClinic(...args);
export const getSetting = (...args) => impl.getSetting(...args);
export const setSetting = (...args) => impl.setSetting(...args);
export const listSettings = (...args) => impl.listSettings(...args);
