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

  static unauthorized(message = "Authentication required.") {
    return new ApiError(401, "UNAUTHORIZED", message);
  }

  static notImplemented(message = "This feature is not available yet.") {
    return new ApiError(501, "NOT_IMPLEMENTED", message);
  }
}
