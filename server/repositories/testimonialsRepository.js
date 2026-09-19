/**
 * testimonialsRepository facade. Chooses the PostgreSQL implementation when DATABASE_URL is
 * configured, otherwise the bundled demo implementation. Callers import from
 * this module only, so the data source can change without touching them.
 */
import { isDatabaseConfigured } from "@/lib/database";
import * as pg from "./pg/testimonialsRepository";
import * as demo from "./demo/testimonialsRepository";

const impl = isDatabaseConfigured() ? pg : demo;

export const listTestimonials = (...args) => impl.listTestimonials(...args);
export const getTestimonialById = (...args) => impl.getTestimonialById(...args);
export const createTestimonial = (...args) => impl.createTestimonial(...args);
export const updateTestimonial = (...args) => impl.updateTestimonial(...args);
export const deleteTestimonial = (...args) => impl.deleteTestimonial(...args);
