/**
 * doctorsRepository facade. Chooses the PostgreSQL implementation when DATABASE_URL is
 * configured, otherwise the bundled demo implementation. Callers import from
 * this module only, so the data source can change without touching them.
 */
import { isDatabaseConfigured } from "@/lib/database";
import * as pg from "./pg/doctorsRepository";
import * as demo from "./demo/doctorsRepository";

const impl = isDatabaseConfigured() ? pg : demo;

export const listDoctors = (...args) => impl.listDoctors(...args);
export const getDoctorBySlug = (...args) => impl.getDoctorBySlug(...args);
export const getDoctorById = (...args) => impl.getDoctorById(...args);
export const getDoctorByIdOrSlug = (...args) => impl.getDoctorByIdOrSlug(...args);
export const getLeadDoctor = (...args) => impl.getLeadDoctor(...args);
export const listDoctorsByService = (...args) => impl.listDoctorsByService(...args);
export const createDoctor = (...args) => impl.createDoctor(...args);
export const updateDoctor = (...args) => impl.updateDoctor(...args);
export const deactivateDoctor = (...args) => impl.deactivateDoctor(...args);
