/**
 * servicesRepository facade. Chooses the PostgreSQL implementation when DATABASE_URL is
 * configured, otherwise the bundled demo implementation. Callers import from
 * this module only, so the data source can change without touching them.
 */
import { isDatabaseConfigured } from "@/lib/database";
import * as pg from "./pg/servicesRepository";
import * as demo from "./demo/servicesRepository";

const impl = isDatabaseConfigured() ? pg : demo;

export const listServices = (...args) => impl.listServices(...args);
export const getServiceBySlug = (...args) => impl.getServiceBySlug(...args);
export const getServiceById = (...args) => impl.getServiceById(...args);
export const getServiceByIdOrSlug = (...args) => impl.getServiceByIdOrSlug(...args);
export const listServicesForDoctor = (...args) => impl.listServicesForDoctor(...args);
export const createService = (...args) => impl.createService(...args);
export const updateService = (...args) => impl.updateService(...args);
export const deactivateService = (...args) => impl.deactivateService(...args);
