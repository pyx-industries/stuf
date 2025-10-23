/**
 * Standard error actions that provide guidance to users
 */
export const ERROR_ACTIONS = {
  TRY_AGAIN: "Please try again later",
  CONTACT_SUPPORT: "Please contact support if this problem persists",
  TRY_AGAIN_OR_CONTACT_SUPPORT:
    "Please try again later or contact support if the problem persists",
  VERIFY_EXISTS: "Please verify the resource exists",
  REQUEST_ACCESS: "Contact an administrator to request access",
  CHECK_PERMISSIONS: "Please check your permissions",
  REFRESH_PAGE: "Please refresh the page and try again",
  CHECK_INPUT: "Please verify your input and try again",
} as const;

/**
 * Common error message templates
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Network request failed",
  UNKNOWN_ERROR: "An unexpected error occurred",
  NOT_FOUND: (resource: string) => `${resource} not found`,
  FORBIDDEN: (resource: string) => `Access to ${resource} is forbidden`,
  FETCH_FAILED: (resource: string, details?: string) =>
    `Failed to fetch ${resource}${details ? `: ${details}` : ""}`,
  VALIDATION_FAILED: (operation: string) =>
    `Validation failed for ${operation}`,
  OPERATION_FAILED: (operation: string, details?: string) =>
    `${operation} failed${details ? `: ${details}` : ""}`,
} as const;
