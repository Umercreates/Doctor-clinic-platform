/**
 * patientsRepository facade. Chooses the PostgreSQL implementation when DATABASE_URL is
 * configured, otherwise the bundled demo implementation. Callers import from
 * this module only, so the data source can change without touching them.
 */
import { isDatabaseConfigured } from "@/lib/database";
import * as pg from "./pg/patientsRepository";
import * as demo from "./demo/patientsRepository";

const impl = isDatabaseConfigured() ? pg : demo;

export const findPatientByEmail = (...args) => impl.findPatientByEmail(...args);
export const getPatientById = (...args) => impl.getPatientById(...args);
export const upsertPatient = (...args) => impl.upsertPatient(...args);
export const listPatients = (...args) => impl.listPatients(...args);
export const countPatients = (...args) => impl.countPatients(...args);
export const updatePatient = (...args) => impl.updatePatient(...args);
