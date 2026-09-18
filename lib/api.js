/**
 * Thin fetch wrapper for client components talking to the REST API.
 *
 * All API responses use a consistent envelope:
 *   success -> { success: true, data, meta? }
 *   failure -> { success: false, error: { code, message, details? } }
 * Requests are same-origin, so the HTTP-only session cookie is sent automatically.
 */

export class ApiClientError extends Error {
  constructor(message, { status, code, details } = {}) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const API_BASE = "/api/v1";

export async function apiFetch(path, { method = "GET", body, headers, signal } = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal,
      cache: "no-store",
      credentials: "same-origin",
    });
  } catch (error) {
    if (error?.name === "AbortError") throw error;
    throw new ApiClientError("We could not reach the server. Please check your connection and try again.", {
      status: 0,
      code: "NETWORK_ERROR",
    });
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok || payload?.success === false) {
    const error = payload?.error || {};
    throw new ApiClientError(error.message || "Something went wrong. Please try again.", {
      status: response.status,
      code: error.code || "REQUEST_FAILED",
      details: error.details,
    });
  }

  return payload;
}

export const api = {
  getDoctors: () => apiFetch("/doctors"),
  getDoctor: (slug) => apiFetch(`/doctors/${slug}`),
  getServices: () => apiFetch("/services"),
  getService: (slug) => apiFetch(`/services/${slug}`),
  getAvailability: ({ doctor, date, service }, options) => {
    const params = new URLSearchParams({ doctor, date, service });
    return apiFetch(`/appointments/availability?${params.toString()}`, options);
  },
  getAvailableDays: ({ doctor, service, from, to }, options) =>
    apiFetch(`/appointments/availability/days?${new URLSearchParams({ doctor, service, from, to }).toString()}`, options),
  createAppointment: (payload) => apiFetch("/appointments", { method: "POST", body: payload }),
  sendContactMessage: (payload) => apiFetch("/contact", { method: "POST", body: payload }),
  login: (payload) => apiFetch("/auth/login", { method: "POST", body: payload }),
  logout: () => apiFetch("/auth/logout", { method: "POST", body: {} }),
  me: () => apiFetch("/auth/me"),
  // Dashboard (authenticated)
  listAppointments: (params = {}) => apiFetch(`/appointments?${new URLSearchParams(params).toString()}`),
  getAppointment: (id) => apiFetch(`/appointments/${id}`),
  updateAppointment: (id, payload) => apiFetch(`/appointments/${id}`, { method: "PATCH", body: payload }),
  cancelAppointment: (id, reason) => apiFetch(`/appointments/${id}${reason ? `?reason=${encodeURIComponent(reason)}` : ""}`, { method: "DELETE" }),
  getRescheduleOptions: (id, date, options) => apiFetch(`/appointments/${id}/reschedule?date=${encodeURIComponent(date)}`, options),
  rescheduleAppointment: (id, payload) => apiFetch(`/appointments/${id}/reschedule`, { method: "POST", body: payload }),
  listPatients: (params = {}) => apiFetch(`/patients?${new URLSearchParams(params).toString()}`),
  getPatient: (id) => apiFetch(`/patients/${id}`),
  // Availability management (authenticated)
  listAvailability: (params = {}) => apiFetch(`/availability?${new URLSearchParams(params).toString()}`),
  createScheduleBlock: (payload) => apiFetch("/availability", { method: "POST", body: payload }),
  updateScheduleBlock: (id, payload) => apiFetch(`/availability/${id}`, { method: "PATCH", body: payload }),
  deleteScheduleBlock: (id) => apiFetch(`/availability/${id}`, { method: "DELETE" }),
  createException: (payload) => apiFetch("/availability/exceptions", { method: "POST", body: payload }),
  updateException: (id, payload) => apiFetch(`/availability/exceptions/${id}`, { method: "PATCH", body: payload }),
  deleteException: (id) => apiFetch(`/availability/exceptions/${id}`, { method: "DELETE" }),
};
