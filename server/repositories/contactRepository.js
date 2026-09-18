/**
 * contactRepository facade. Chooses the PostgreSQL implementation when DATABASE_URL is
 * configured, otherwise the bundled demo implementation. Callers import from
 * this module only, so the data source can change without touching them.
 */
import { isDatabaseConfigured } from "@/lib/database";
import * as pg from "./pg/contactRepository";
import * as demo from "./demo/contactRepository";

const impl = isDatabaseConfigured() ? pg : demo;

export const createContactMessage = (...args) => impl.createContactMessage(...args);
