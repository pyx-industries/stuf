import { getConfig } from "@/config";
import {
  ApiError,
  ForbiddenError,
  NetworkError,
  NotFoundError,
  ServerError,
  UnauthorizedError,
  ValidationError,
} from "@/errors/api";
import type {
  AuthContext,
  IApiClient,
  RequestOptions,
} from "@/types/services/api";

/**
 * HTTP client for making API requests
 */
export class ApiClient implements IApiClient {
  private auth: AuthContext | null = null;

  setAuth(auth: AuthContext) {
    this.auth = auth;
  }

  async request(endpoint: string, options: RequestOptions = {}): Promise<any> {
    try {
      const { apiBaseUrl } = getConfig();
      const token = this.auth?.user?.access_token;
      const url = `${apiBaseUrl}${endpoint}`;

      // Always include Authorization header if we have a token
      const headers: Record<string, string> = {
        ...(token && { Authorization: `Bearer ${token}` }),
      };

      // Merge in custom headers
      if (options.headers) {
        Object.assign(headers, options.headers);
      }

      // Set default Content-Type for JSON requests, but skip for FormData
      const isFormData = options.body instanceof FormData;
      if (!headers["Content-Type"] && !isFormData) {
        headers["Content-Type"] = "application/json";
      }

      // Remove any headers with null/undefined values that might confuse fetch()
      Object.keys(headers).forEach((key) => {
        if (headers[key] === null || headers[key] === undefined) {
          delete headers[key];
        }
      });

      // Exclude headers from options spread to avoid overriding processed headers
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { headers: _optionsHeaders, ...restOptions } = options;

      const config = {
        ...restOptions,
        headers,
      };

      const response = await fetch(url, config);

      if (!response.ok) {
        // Try to extract error message from response
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            errorMessage =
              errorData.message || errorData.detail || errorMessage;
          }
        } catch {
          // Ignore parsing errors, use default message
        }

        // Throw specific error based on status code
        switch (response.status) {
          case 401:
            throw new UnauthorizedError(errorMessage);
          case 403:
            throw new ForbiddenError(errorMessage);
          case 404:
            throw new NotFoundError(errorMessage);
          case 422:
            throw new ValidationError(errorMessage);
          default:
            if (response.status >= 500) {
              throw new ServerError(errorMessage);
            }
            throw new ApiError(errorMessage, response.status);
        }
      }

      // Handle different content types
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return await response.json();
      } else {
        return response;
      }
    } catch (error) {
      // If it's already an ApiError, rethrow it
      if (error instanceof ApiError) {
        throw error;
      }
      // Otherwise, wrap it in a NetworkError
      const message =
        error instanceof Error ? error.message : "Network request failed";
      throw new NetworkError(
        message,
        error instanceof Error ? error : undefined,
      );
    }
  }
}
