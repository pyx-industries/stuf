import { describe, it, expect, vi, beforeEach } from "vitest";
import { CollectionsService } from "./collectionsService";
import type { IApiClient } from "@/types/services/api";
import type { User } from "@/types";
import { NotFoundError, ForbiddenError } from "@/errors/api";
import { ERROR_ACTIONS } from "@/errors/messages";

describe("CollectionsService", () => {
  let mockApiClient: IApiClient;
  let collectionsService: CollectionsService;

  beforeEach(() => {
    mockApiClient = {
      setAuth: vi.fn(),
      request: vi.fn(),
    };
    collectionsService = new CollectionsService(mockApiClient);
  });

  describe("getCollections", () => {
    it("returns collections with file counts when all requests succeed", async () => {
      const mockUser: User = {
        username: "testuser",
        name: "Test User",
        email: "test@example.com",
        roles: [],
        collections: {
          "collection-a": ["read", "write"],
          "collection-b": ["read"],
        },
      };

      vi.mocked(mockApiClient.request)
        .mockResolvedValueOnce({ files: [1, 2, 3] }) // collection-a has 3 files
        .mockResolvedValueOnce({ files: [1, 2] }); // collection-b has 2 files

      const result = await collectionsService.getCollections(mockUser);

      expect(result.collections).toHaveLength(2);
      expect(result.collections[0]).toEqual({
        id: "collection-a",
        name: "collection-a",
        fileCount: 3,
      });
      expect(result.collections[1]).toEqual({
        id: "collection-b",
        name: "collection-b",
        fileCount: 2,
      });
      expect(result.errors).toHaveLength(0);
    });

    it("handles partial failures gracefully", async () => {
      const mockUser: User = {
        username: "testuser",
        name: "Test User",
        email: "test@example.com",
        roles: [],
        collections: {
          "collection-a": ["read"],
          "collection-b": ["read"],
          "collection-c": ["read"],
        },
      };

      vi.mocked(mockApiClient.request)
        .mockResolvedValueOnce({ files: [1, 2] }) // collection-a succeeds
        .mockRejectedValueOnce(new Error("Network error")) // collection-b fails
        .mockResolvedValueOnce({ files: [1] }); // collection-c succeeds

      const result = await collectionsService.getCollections(mockUser);

      expect(result.collections).toHaveLength(3);
      expect(result.collections[0].fileCount).toBe(2);
      expect(result.collections[1].fileCount).toBe(0); // Failed collection has 0 count
      expect(result.collections[2].fileCount).toBe(1);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain("collection-b");
      expect(result.errors[0].action).toBe(
        ERROR_ACTIONS.TRY_AGAIN_OR_CONTACT_SUPPORT,
      );
    });

    it("returns all collections with zero counts when all requests fail", async () => {
      const mockUser: User = {
        username: "testuser",
        name: "Test User",
        email: "test@example.com",
        roles: [],
        collections: {
          "collection-a": ["read"],
          "collection-b": ["read"],
        },
      };

      vi.mocked(mockApiClient.request)
        .mockRejectedValueOnce(new Error("Error 1"))
        .mockRejectedValueOnce(new Error("Error 2"));

      const result = await collectionsService.getCollections(mockUser);

      expect(result.collections).toHaveLength(2);
      expect(result.collections[0].fileCount).toBe(0);
      expect(result.collections[1].fileCount).toBe(0);

      expect(result.errors).toHaveLength(2);
      expect(result.errors[0].message).toContain("collection-a");
      expect(result.errors[0].action).toBe(
        ERROR_ACTIONS.TRY_AGAIN_OR_CONTACT_SUPPORT,
      );
      expect(result.errors[1].message).toContain("collection-b");
      expect(result.errors[1].action).toBe(
        ERROR_ACTIONS.TRY_AGAIN_OR_CONTACT_SUPPORT,
      );
    });

    it("handles NotFoundError with correct action", async () => {
      const mockUser: User = {
        username: "testuser",
        name: "Test User",
        email: "test@example.com",
        roles: [],
        collections: {
          "missing-collection": ["read"],
        },
      };

      vi.mocked(mockApiClient.request).mockRejectedValueOnce(
        new NotFoundError("Collection not found"),
      );

      const result = await collectionsService.getCollections(mockUser);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain("missing-collection");
      expect(result.errors[0].action).toBe(ERROR_ACTIONS.VERIFY_EXISTS);
    });

    it("handles ForbiddenError with correct action", async () => {
      const mockUser: User = {
        username: "testuser",
        name: "Test User",
        email: "test@example.com",
        roles: [],
        collections: {
          "forbidden-collection": ["read"],
        },
      };

      vi.mocked(mockApiClient.request).mockRejectedValueOnce(
        new ForbiddenError("Access forbidden"),
      );

      const result = await collectionsService.getCollections(mockUser);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain("forbidden-collection");
      expect(result.errors[0].action).toBe(ERROR_ACTIONS.REQUEST_ACCESS);
    });

    it("returns empty arrays for user with no collections", async () => {
      const mockUser: User = {
        username: "testuser",
        name: "Test User",
        email: "test@example.com",
        roles: [],
        collections: {},
      };

      const result = await collectionsService.getCollections(mockUser);

      expect(result.collections).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
      expect(mockApiClient.request).not.toHaveBeenCalled();
    });

    it("handles user with undefined collections", async () => {
      const mockUser: User = {
        username: "testuser",
        name: "Test User",
        email: "test@example.com",
        roles: [],
        collections: {},
      };

      const result = await collectionsService.getCollections(mockUser);

      expect(result.collections).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
      expect(mockApiClient.request).not.toHaveBeenCalled();
    });

    it("handles response with no files array", async () => {
      const mockUser: User = {
        username: "testuser",
        name: "Test User",
        email: "test@example.com",
        roles: [],
        collections: {
          "collection-a": ["read"],
        },
      };

      vi.mocked(mockApiClient.request).mockResolvedValueOnce({});

      const result = await collectionsService.getCollections(mockUser);

      expect(result.collections).toHaveLength(1);
      expect(result.collections[0].fileCount).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it("handles response with empty files array", async () => {
      const mockUser: User = {
        username: "testuser",
        name: "Test User",
        email: "test@example.com",
        roles: [],
        collections: {
          "collection-a": ["read"],
        },
      };

      vi.mocked(mockApiClient.request).mockResolvedValueOnce({ files: [] });

      const result = await collectionsService.getCollections(mockUser);

      expect(result.collections).toHaveLength(1);
      expect(result.collections[0].fileCount).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it("handles unexpected error", async () => {
      const mockUser: User = {
        username: "testuser",
        name: "Test User",
        email: "test@example.com",
        roles: [],
        collections: {
          "collection-a": ["read"],
        },
      };

      vi.mocked(mockApiClient.request).mockRejectedValueOnce("String error");

      const result = await collectionsService.getCollections(mockUser);

      expect(result.collections).toHaveLength(1);
      expect(result.collections[0].fileCount).toBe(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain(
        "An unexpected error occurred",
      );
      expect(result.errors[0].action).toBe(
        ERROR_ACTIONS.TRY_AGAIN_OR_CONTACT_SUPPORT,
      );
    });

    it("makes correct API calls for each collection", async () => {
      const mockUser: User = {
        username: "testuser",
        name: "Test User",
        email: "test@example.com",
        roles: [],
        collections: {
          "collection-a": ["read"],
          "collection-b": ["read"],
        },
      };

      vi.mocked(mockApiClient.request).mockResolvedValue({ files: [] });

      await collectionsService.getCollections(mockUser);

      expect(mockApiClient.request).toHaveBeenCalledTimes(2);
      expect(mockApiClient.request).toHaveBeenCalledWith(
        "/api/files/collection-a",
      );
      expect(mockApiClient.request).toHaveBeenCalledWith(
        "/api/files/collection-b",
      );
    });
  });
});
