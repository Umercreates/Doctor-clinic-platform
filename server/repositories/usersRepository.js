/**
 * usersRepository facade. Chooses the PostgreSQL implementation when DATABASE_URL is
 * configured, otherwise the bundled demo implementation. Callers import from
 * this module only, so the data source can change without touching them.
 */
import { isDatabaseConfigured } from "@/lib/database";
import * as pg from "./pg/usersRepository";
import * as demo from "./demo/usersRepository";

const impl = isDatabaseConfigured() ? pg : demo;

export const findUserByAuthId = (...args) => impl.findUserByAuthId(...args);
export const findUserByEmail = (...args) => impl.findUserByEmail(...args);
export const linkAuthUser = (...args) => impl.linkAuthUser(...args);
export const getUserById = (...args) => impl.getUserById(...args);
export const listUsers = (...args) => impl.listUsers(...args);
export const updateLastLogin = (...args) => impl.updateLastLogin(...args);
