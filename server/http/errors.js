/**
 * Application-level error used by services and translated to HTTP responses by
 * `server/http/response.js`.
 */
export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(message = "Invalid request.", details) {
    return new ApiError(400, "BAD_REQUEST", message, details);
  }

  static validation(details, message = "Please correct the highlighted fields.") {
    return new ApiError(422, "VALIDATION_ERROR", message, details);
  }

  static notFound(message = "The requested resource was not found.") {
    return new ApiError(404, "NOT_FOUND", message);
  }

  static conflict(message = "This request conflicts with existing data.", details) {
    return new ApiError(409, "CONFLICT", message, details);
  }

  /** A booking/reschedule target that is no longer free. */
  static slotUnavailable(message = "This appointment slot is no longer available.") {
    return new ApiError(409, "SLOT_UNAVAILABLE", message, { time: "This slot is no longer available. Please select another time." });
  }

  static unauthorized(message = "Please sign in to continue.") {
    return new ApiError(401, "UNAUTHORIZED", message);
  }

  static forbidden(message = "You do not have permission to perform this action.") {
    return new ApiError(403, "FORBIDDEN", message);
  }

  static tooManyRequests(message = "Too many attempts. Please wait a moment and try again.") {
    return new ApiError(429, "RATE_LIMITED", message);
  }

  static serviceUnavailable(message = "This service is temporarily unavailable.") {
    return new ApiError(503, "SERVICE_UNAVAILABLE", message);
  }

  static notImplemented(message = "This feature is not available yet.") {
    return new ApiError(501, "NOT_IMPLEMENTED", message);
  }
}
