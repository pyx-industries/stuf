/**
 * Auth context for API client
 */
export interface AuthContext {
  user?: {
    access_token?: string;
  };
}

/**
 * Request options for API client
 */
export interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

/**
 * Interface for API client
 */
export interface IApiClient {
  setAuth(auth: AuthContext): void;
  request(endpoint: string, options?: RequestOptions): Promise<any>;
}
