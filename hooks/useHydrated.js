"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * Returns false during server rendering and hydration, true afterwards.
 * Use for UI that depends on the client's clock or viewport (e.g. calendars)
 * to avoid hydration mismatches without setting state in effects.
 */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
