/**
 * contentRepository facade. Chooses the PostgreSQL implementation when DATABASE_URL is
 * configured, otherwise the bundled demo implementation. Callers import from
 * this module only, so the data source can change without touching them.
 */
import { isDatabaseConfigured } from "@/lib/database";
import * as pg from "./pg/contentRepository";
import * as demo from "./demo/contentRepository";

const impl = isDatabaseConfigured() ? pg : demo;

export const listContentBlocks = (...args) => impl.listContentBlocks(...args);
export const getContentBlock = (...args) => impl.getContentBlock(...args);
export const setContentBlock = (...args) => impl.setContentBlock(...args);
export const deleteContentBlock = (...args) => impl.deleteContentBlock(...args);
