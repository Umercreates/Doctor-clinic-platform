/**
 * faqsRepository facade. Chooses the PostgreSQL implementation when DATABASE_URL is
 * configured, otherwise the bundled demo implementation. Callers import from
 * this module only, so the data source can change without touching them.
 */
import { isDatabaseConfigured } from "@/lib/database";
import * as pg from "./pg/faqsRepository";
import * as demo from "./demo/faqsRepository";

const impl = isDatabaseConfigured() ? pg : demo;

export const listFaqs = (...args) => impl.listFaqs(...args);
export const listFaqCategories = (...args) => impl.listFaqCategories(...args);
export const getFaqById = (...args) => impl.getFaqById(...args);
export const getFaqByKey = (...args) => impl.getFaqByKey(...args);
export const createFaq = (...args) => impl.createFaq(...args);
export const updateFaq = (...args) => impl.updateFaq(...args);
export const deleteFaq = (...args) => impl.deleteFaq(...args);
