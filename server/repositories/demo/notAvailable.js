import { ApiError } from "@/server/http/errors";

/** Used by demo-mode repositories for operations that require PostgreSQL. */
export function notAvailable() {
  throw ApiError.serviceUnavailable("This feature requires the database. Set DATABASE_URL and run `npm run db:setup`.");
}
