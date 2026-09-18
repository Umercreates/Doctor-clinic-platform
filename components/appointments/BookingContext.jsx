"use client";

import { createContext, useContext, useMemo, useReducer } from "react";
import { bookingReducer, createInitialState } from "./bookingReducer";

const BookingContext = createContext(null);

/**
 * Holds booking wizard state and the catalogue (doctors, services) it selects from.
 * The catalogue is passed in from the server today and can come from the API later.
 */
export function BookingProvider({ doctors, services, initialDoctor, initialService, children }) {
  const [state, dispatch] = useReducer(
    bookingReducer,
    { doctorId: initialDoctor, serviceId: initialService, doctors, services },
    createInitialState,
  );

  const value = useMemo(() => {
    const doctor = doctors.find((d) => d.id === state.doctorId) || null;
    const service = services.find((s) => s.id === state.serviceId) || null;
    const availableServices = doctor ? services.filter((s) => doctor.serviceIds.includes(s.id)) : services;
    return { state, dispatch, doctors, services, doctor, service, availableServices };
  }, [state, doctors, services]);

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (!context) throw new Error("useBooking must be used within a BookingProvider");
  return context;
}
