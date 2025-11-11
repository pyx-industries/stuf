import type { File } from "@/types";
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useUser } from "../../user/useUser";
import { useFilePermissions } from "./useFilePermissions";

// Mock dependencies
vi.mock("../../user/useUser", () => ({
  useUser: vi.fn(),
}));

// Helper to create a mock file
function createMockFile(overrides?: Partial<File>): File {
  return {
    object_name: "test-file.txt",
    collection: "test-collection",
    owner: "testuser",
    original_filename: "test-file.txt",
    upload_time: "2024-01-01T00:00:00Z",
    content_type: "text/plain",
    size: 1024,
    ...overrides,
  };
}

describe("useFilePermissions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("when user is not authenticated", () => {
    it("returns all permissions as false when user is null", () => {
      vi.mocked(useUser).mockReturnValue(null);
      const file = createMockFile();

      const { result } = renderHook(() => useFilePermissions(file));

      expect(result.current).toEqual({
        canRead: false,
        canWrite: false,
        canDelete: false,
        canDownload: false,
        canArchive: false,
        canViewHistory: false,
        isOwnFile: false,
      });
    });
  });

  describe("when user has delete permission", () => {
    it("grants full access for own file", () => {
      vi.mocked(useUser).mockReturnValue({
        username: "testuser",
        name: "Test User",
        email: "test@example.com",
        roles: [],
        collections: {
          "test-collection": ["delete"],
        },
      });
      const file = createMockFile({ owner: "testuser" });

      const { result } = renderHook(() => useFilePermissions(file));

      expect(result.current).toEqual({
        canRead: true,
        canWrite: true,
        canDelete: true,
        canDownload: true,
        canArchive: true,
        canViewHistory: true,
        isOwnFile: true,
      });
    });

    it("grants full access for other user's file", () => {
      vi.mocked(useUser).mockReturnValue({
        username: "testuser",
        name: "Test User",
        email: "test@example.com",
        roles: [],
        collections: {
          "test-collection": ["delete"],
        },
      });
      const file = createMockFile({ owner: "otheruser" });

      const { result } = renderHook(() => useFilePermissions(file));

      expect(result.current).toEqual({
        canRead: true,
        canWrite: true,
        canDelete: true,
        canDownload: true,
        canArchive: true,
        canViewHistory: true,
        isOwnFile: false,
      });
    });

    it("grants full access when user has multiple permissions including delete", () => {
      vi.mocked(useUser).mockReturnValue({
        username: "testuser",
        name: "Test User",
        email: "test@example.com",
        roles: [],
        collections: {
          "test-collection": ["read", "write", "delete"],
        },
      });
      const file = createMockFile({ owner: "testuser" });

      const { result } = renderHook(() => useFilePermissions(file));

      expect(result.current).toEqual({
        canRead: true,
        canWrite: true,
        canDelete: true,
        canDownload: true,
        canArchive: true,
        canViewHistory: true,
        isOwnFile: true,
      });
    });
  });

  describe("when user has write permission", () => {
    it("allows download for own file", () => {
      vi.mocked(useUser).mockReturnValue({
        username: "testuser",
        name: "Test User",
        email: "test@example.com",
        roles: [],
        collections: {
          "test-collection": ["write"],
        },
      });
      const file = createMockFile({ owner: "testuser" });

      const { result } = renderHook(() => useFilePermissions(file));

      expect(result.current).toEqual({
        canRead: true,
        canWrite: true,
        canDelete: false,
        canDownload: true,
        canArchive: false,
        canViewHistory: false,
        isOwnFile: true,
      });
    });

    it("does not allow download for other user's file", () => {
      vi.mocked(useUser).mockReturnValue({
        username: "testuser",
        name: "Test User",
        email: "test@example.com",
        roles: [],
        collections: {
          "test-collection": ["write"],
        },
      });
      const file = createMockFile({ owner: "otheruser" });

      const { result } = renderHook(() => useFilePermissions(file));

      expect(result.current).toEqual({
        canRead: true,
        canWrite: true,
        canDelete: false,
        canDownload: false,
        canArchive: false,
        canViewHistory: false,
        isOwnFile: false,
      });
    });

    it("allows download when user has read and write permissions for own file", () => {
      vi.mocked(useUser).mockReturnValue({
        username: "testuser",
        name: "Test User",
        email: "test@example.com",
        roles: [],
        collections: {
          "test-collection": ["read", "write"],
        },
      });
      const file = createMockFile({ owner: "testuser" });

      const { result } = renderHook(() => useFilePermissions(file));

      expect(result.current).toEqual({
        canRead: true,
        canWrite: true,
        canDelete: false,
        canDownload: true,
        canArchive: false,
        canViewHistory: false,
        isOwnFile: true,
      });
    });
  });

  describe("when user has read permission", () => {
    it("allows download for own file", () => {
      vi.mocked(useUser).mockReturnValue({
        username: "testuser",
        name: "Test User",
        email: "test@example.com",
        roles: [],
        collections: {
          "test-collection": ["read"],
        },
      });
      const file = createMockFile({ owner: "testuser" });

      const { result } = renderHook(() => useFilePermissions(file));

      expect(result.current).toEqual({
        canRead: true,
        canWrite: false,
        canDelete: false,
        canDownload: true,
        canArchive: false,
        canViewHistory: false,
        isOwnFile: true,
      });
    });

    it("allows download for other user's file", () => {
      vi.mocked(useUser).mockReturnValue({
        username: "testuser",
        name: "Test User",
        email: "test@example.com",
        roles: [],
        collections: {
          "test-collection": ["read"],
        },
      });
      const file = createMockFile({ owner: "otheruser" });

      const { result } = renderHook(() => useFilePermissions(file));

      expect(result.current).toEqual({
        canRead: true,
        canWrite: false,
        canDelete: false,
        canDownload: true,
        canArchive: false,
        canViewHistory: false,
        isOwnFile: false,
      });
    });

    it("does not grant write or delete permissions", () => {
      vi.mocked(useUser).mockReturnValue({
        username: "testuser",
        name: "Test User",
        email: "test@example.com",
        roles: [],
        collections: {
          "test-collection": ["read"],
        },
      });
      const file = createMockFile();

      const { result } = renderHook(() => useFilePermissions(file));

      expect(result.current.canWrite).toBe(false);
      expect(result.current.canDelete).toBe(false);
      expect(result.current.canArchive).toBe(false);
      expect(result.current.canViewHistory).toBe(false);
    });
  });

  describe("isOwnFile calculation", () => {
    it("correctly identifies own file", () => {
      vi.mocked(useUser).mockReturnValue({
        username: "testuser",
        name: "Test User",
        email: "test@example.com",
        roles: [],
        collections: {
          "test-collection": ["read"],
        },
      });
      const file = createMockFile({ owner: "testuser" });

      const { result } = renderHook(() => useFilePermissions(file));

      expect(result.current.isOwnFile).toBe(true);
    });

    it("correctly identifies other user's file", () => {
      vi.mocked(useUser).mockReturnValue({
        username: "testuser",
        name: "Test User",
        email: "test@example.com",
        roles: [],
        collections: {
          "test-collection": ["read"],
        },
      });
      const file = createMockFile({ owner: "otheruser" });

      const { result } = renderHook(() => useFilePermissions(file));

      expect(result.current.isOwnFile).toBe(false);
    });

    it("handles case-sensitive owner comparison", () => {
      vi.mocked(useUser).mockReturnValue({
        username: "TestUser",
        name: "Test User",
        email: "test@example.com",
        roles: [],
        collections: {
          "test-collection": ["read"],
        },
      });
      const file = createMockFile({ owner: "testuser" });

      const { result } = renderHook(() => useFilePermissions(file));

      expect(result.current.isOwnFile).toBe(false);
    });
  });

  describe("permission precedence", () => {
    it("prioritizes delete permission over write", () => {
      vi.mocked(useUser).mockReturnValue({
        username: "testuser",
        name: "Test User",
        email: "test@example.com",
        roles: [],
        collections: {
          "test-collection": ["write", "delete"],
        },
      });
      const file = createMockFile({ owner: "otheruser" });

      const { result } = renderHook(() => useFilePermissions(file));

      // Should get full access due to delete permission
      expect(result.current.canDownload).toBe(true);
      expect(result.current.canArchive).toBe(true);
      expect(result.current.canViewHistory).toBe(true);
    });

    it("prioritizes delete permission over read", () => {
      vi.mocked(useUser).mockReturnValue({
        username: "testuser",
        name: "Test User",
        email: "test@example.com",
        roles: [],
        collections: {
          "test-collection": ["read", "delete"],
        },
      });
      const file = createMockFile({ owner: "otheruser" });

      const { result } = renderHook(() => useFilePermissions(file));

      // Should get full access due to delete permission
      expect(result.current.canWrite).toBe(true);
      expect(result.current.canDelete).toBe(true);
      expect(result.current.canArchive).toBe(true);
      expect(result.current.canViewHistory).toBe(true);
    });

    it("prioritizes write permission over read for own files", () => {
      vi.mocked(useUser).mockReturnValue({
        username: "testuser",
        name: "Test User",
        email: "test@example.com",
        roles: [],
        collections: {
          "test-collection": ["read", "write"],
        },
      });
      const file = createMockFile({ owner: "testuser" });

      const { result } = renderHook(() => useFilePermissions(file));

      // Write permission is checked first, so should allow download for own file
      expect(result.current.canDownload).toBe(true);
      expect(result.current.canWrite).toBe(true);
    });
  });

  describe("memoization behavior", () => {
    it("returns same reference when dependencies don't change", () => {
      vi.mocked(useUser).mockReturnValue({
        username: "testuser",
        name: "Test User",
        email: "test@example.com",
        roles: [],
        collections: {
          "test-collection": ["read"],
        },
      });
      const file = createMockFile();

      const { result, rerender } = renderHook(() => useFilePermissions(file));
      const firstResult = result.current;

      rerender();
      const secondResult = result.current;

      expect(firstResult).toBe(secondResult);
    });

    it("returns new reference when user changes", () => {
      const user1 = {
        username: "testuser1",
        name: "Test User 1",
        email: "test1@example.com",
        roles: [],
        collections: {
          "test-collection": ["read"],
        },
      };

      const user2 = {
        username: "testuser2",
        name: "Test User 2",
        email: "test2@example.com",
        roles: [],
        collections: {
          "test-collection": ["write"],
        },
      };

      vi.mocked(useUser).mockReturnValue(user1);
      const file = createMockFile();

      const { result, rerender } = renderHook(() => useFilePermissions(file));
      const firstResult = result.current;

      vi.mocked(useUser).mockReturnValue(user2);
      rerender();
      const secondResult = result.current;

      expect(firstResult).not.toBe(secondResult);
    });

    it("returns new reference when file changes", () => {
      vi.mocked(useUser).mockReturnValue({
        username: "testuser",
        name: "Test User",
        email: "test@example.com",
        roles: [],
        collections: {
          "test-collection": ["read"],
        },
      });

      const file1 = createMockFile({ object_name: "file1.txt" });
      const file2 = createMockFile({ object_name: "file2.txt" });

      const { result, rerender } = renderHook(
        ({ file }) => useFilePermissions(file),
        { initialProps: { file: file1 } },
      );
      const firstResult = result.current;

      rerender({ file: file2 });
      const secondResult = result.current;

      expect(firstResult).not.toBe(secondResult);
    });
  });
});
