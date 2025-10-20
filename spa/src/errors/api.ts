/**
 * Base API error class
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public originalError?: Error,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * Resource not found (404)
 */
export class NotFoundError extends ApiError {
  constructor(message = "Resource not found") {
    super(message, 404);
  }
}

/**
 * Forbidden access (403)
 */
export class ForbiddenError extends ApiError {
  constructor(message = "Access forbidden") {
    super(message, 403);
  }
}

/**
 * Unauthorized access (401)
 */
export class UnauthorizedError extends ApiError {
  constructor(message = "Unauthorized") {
    super(message, 401);
  }
}

/**
 * Validation error (422)
 */
export class ValidationError extends ApiError {
  constructor(
    message = "Validation failed",
    public details?: Record<string, string[]>,
  ) {
    super(message, 422);
    this.details = details;
  }
}

/**
 * Network error (connection failed, timeout, etc.)
 */
export class NetworkError extends ApiError {
  constructor(message = "Network request failed", originalError?: Error) {
    super(message, 0, originalError);
  }
}

/**
 * Internal server error (500)
 */
export class ServerError extends ApiError {
  constructor(message = "Internal server error") {
    super(message, 500);
  }
}

/**
 * Application error with user-facing message and action
 * Used by service layer to provide meaningful errors
 */
export class ApplicationError extends Error {
  constructor(
    message: string,
    public action: string,
    public originalError?: Error,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}
