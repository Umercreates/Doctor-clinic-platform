/**
 * Thin fetch wrapper for client components talking to the REST API.
 *
 * All API responses use a consistent envelope:
 *   success -> { data, meta? }
 *   failure -> { error: { code, message, details? } }
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

  if (!response.ok) {
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
    const params = new URLSearchParams({ doctor, date });
    if (service) params.set("service", service);
    return apiFetch(`/appointments/availability?${params.toString()}`, options);
  },
  createAppointment: (payload) => apiFetch("/appointments", { method: "POST", body: payload }),
  sendContactMessage: (payload) => apiFetch("/contact", { method: "POST", body: payload }),
  login: (payload) => apiFetch("/auth/login", { method: "POST", body: payload }),
};
