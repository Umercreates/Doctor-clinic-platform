/**
 * In-memory store used ONLY until PostgreSQL is connected (backend phase).
 *
 * It is attached to `globalThis` so it survives hot reloads in development.
 * Data is lost when the server restarts, which is acceptable for the demo
 * phase. Repositories that write data (appointments, contact messages) use
 * this store and expose the same interface they will have with PostgreSQL.
 */
const KEY = "__doctorClinicMemoryStore";

function createStore() {
  return {
    appointments: [],
    contactMessages: [],
  };
}

export function getMemoryStore() {
  if (!globalThis[KEY]) {
    globalThis[KEY] = createStore();
  }
  return globalThis[KEY];
}
