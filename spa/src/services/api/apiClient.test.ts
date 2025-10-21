import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ApiClient } from "./apiClient";
import type { AuthContext } from "@/types/services/api";
import {
  ApiError,
  NotFoundError,
  ForbiddenError,
  UnauthorizedError,
  ValidationError,
  NetworkError,
  ServerError,
} from "@/errors/api";

describe("ApiClient", () => {
  let apiClient: ApiClient;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    apiClient = new ApiClient();
    fetchMock = vi.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("setAuth", () => {
    it("stores auth context", () => {
      const auth: AuthContext = {
        user: {
          access_token: "test-token-123",
        },
      };

      apiClient.setAuth(auth);

      fetchMock.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ success: true }),
      });

      apiClient.request("/test");

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-token-123",
          }),
        }),
      );
    });
  });

  describe("request", () => {
    it("makes request without auth token when not authenticated", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ data: "test" }),
      });

      await apiClient.request("/api/test");

      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:8000/api/test",
        expect.objectContaining({
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        }),
      );

      const callHeaders = fetchMock.mock.calls[0][1].headers;
      expect(callHeaders.Authorization).toBeUndefined();
    });

    it("includes Bearer token when authenticated", async () => {
      const auth: AuthContext = {
        user: {
          access_token: "my-token",
        },
      };
      apiClient.setAuth(auth);

      fetchMock.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ data: "test" }),
      });

      await apiClient.request("/api/test");

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer my-token",
          }),
        }),
      );
    });

    it("returns parsed JSON for application/json responses", async () => {
      const mockData = { id: 1, name: "Test" };
      fetchMock.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => mockData,
      });

      const result = await apiClient.request("/api/test");

      expect(result).toEqual(mockData);
    });

    it("returns Response object for non-JSON responses", async () => {
      const mockResponse = {
        ok: true,
        headers: new Headers({ "content-type": "text/plain" }),
      };
      fetchMock.mockResolvedValueOnce(mockResponse);

      const result = await apiClient.request("/api/test");

      expect(result).toBe(mockResponse);
    });

    it("does not set Content-Type header for FormData", async () => {
      const formData = new FormData();
      formData.append("file", "test");

      fetchMock.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ success: true }),
      });

      await apiClient.request("/api/upload", {
        method: "POST",
        body: formData,
      });

      const callHeaders = fetchMock.mock.calls[0][1].headers;
      expect(callHeaders["Content-Type"]).toBeUndefined();
    });

    it("sets Content-Type to application/json for non-FormData requests", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ success: true }),
      });

      await apiClient.request("/api/test", {
        method: "POST",
        body: JSON.stringify({ data: "test" }),
      });

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        }),
      );
    });

    it("merges custom headers with default headers", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ success: true }),
      });

      await apiClient.request("/api/test", {
        headers: {
          "X-Custom-Header": "custom-value",
        },
      });

      const callHeaders = fetchMock.mock.calls[0][1].headers;
      expect(callHeaders["Content-Type"]).toBe("application/json");
      expect(callHeaders["X-Custom-Header"]).toBe("custom-value");
    });

    it("removes null and undefined headers", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ success: true }),
      });

      await apiClient.request("/api/test", {
        headers: {
          "X-Null-Header": null as any,
          "X-Undefined-Header": undefined as any,
          "X-Valid-Header": "valid",
        },
      });

      const callHeaders = fetchMock.mock.calls[0][1].headers;
      // Headers with null/undefined values should be removed before fetch is called
      expect(callHeaders).not.toHaveProperty("X-Null-Header");
      expect(callHeaders).not.toHaveProperty("X-Undefined-Header");
      expect(callHeaders["X-Valid-Header"]).toBe("valid");
    });

    it("throws error for non-ok HTTP responses", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: new Headers(),
      });

      await expect(apiClient.request("/api/test")).rejects.toThrow(
        "HTTP error! status: 404",
      );
    });

    it("throws error for network failures", async () => {
      fetchMock.mockRejectedValueOnce(new Error("Network error"));

      await expect(apiClient.request("/api/test")).rejects.toThrow(
        "Network error",
      );
    });

    it("throws UnauthorizedError for 401 status", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Headers(),
      });

      await expect(apiClient.request("/api/test")).rejects.toThrow(
        UnauthorizedError,
      );
    });

    it("throws ForbiddenError for 403 status", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 403,
        headers: new Headers(),
      });

      await expect(apiClient.request("/api/test")).rejects.toThrow(
        ForbiddenError,
      );
    });

    it("throws NotFoundError for 404 status", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: new Headers(),
      });

      await expect(apiClient.request("/api/test")).rejects.toThrow(
        NotFoundError,
      );
    });

    it("throws ValidationError for 422 status", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 422,
        headers: new Headers(),
      });

      await expect(apiClient.request("/api/test")).rejects.toThrow(
        ValidationError,
      );
    });

    it("throws ServerError for 500 status", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: new Headers(),
      });

      await expect(apiClient.request("/api/test")).rejects.toThrow(ServerError);
    });

    it("throws ServerError for 503 status", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 503,
        headers: new Headers(),
      });

      await expect(apiClient.request("/api/test")).rejects.toThrow(ServerError);
    });

    it("throws ApiError for other error status codes", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 418, // I'm a teapot
        headers: new Headers(),
      });

      await expect(apiClient.request("/api/test")).rejects.toThrow(ApiError);
    });

    it("throws NetworkError for fetch failures", async () => {
      fetchMock.mockRejectedValueOnce(new Error("Connection refused"));

      await expect(apiClient.request("/api/test")).rejects.toThrow(
        NetworkError,
      );
    });

    it("extracts error message from JSON response", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ message: "Custom error message" }),
      });

      try {
        await apiClient.request("/api/test");
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        if (error instanceof ApiError) {
          expect(error.message).toBe("Custom error message");
        }
      }
    });

    it("uses detail field from JSON response if message is not present", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ detail: "Detail error message" }),
      });

      try {
        await apiClient.request("/api/test");
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        if (error instanceof ApiError) {
          expect(error.message).toBe("Detail error message");
        }
      }
    });

    it("constructs correct URL with endpoint", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ success: true }),
      });

      await apiClient.request("/api/users/123");

      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:8000/api/users/123",
        expect.any(Object),
      );
    });

    it("passes through request options", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ success: true }),
      });

      await apiClient.request("/api/test", {
        method: "POST",
        body: JSON.stringify({ data: "test" }),
      });

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ data: "test" }),
        }),
      );
    });
  });
});
