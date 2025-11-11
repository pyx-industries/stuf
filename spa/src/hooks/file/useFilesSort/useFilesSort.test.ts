import type { File } from "@/types";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useFilesSort } from "./useFilesSort";

// Helper to create a mock file
function createMockFile(overrides?: Partial<File>): File {
  return {
    object_name: "test-file.txt",
    collection: "test-collection",
    owner: "test@example.com",
    original_filename: "test-file.txt",
    upload_time: "2024-01-01T00:00:00Z",
    content_type: "text/plain",
    size: 1024,
    ...overrides,
  };
}

describe("useFilesSort", () => {
  describe("initialization", () => {
    it("initializes with default options", () => {
      const files = [createMockFile()];
      const { result } = renderHook(() => useFilesSort(files));

      expect(result.current.sortBy).toBe("status");
      expect(result.current.sortDirection).toBe("desc");
      expect(result.current.sortedFiles).toEqual(files);
    });

    it("initializes with custom options", () => {
      const files = [createMockFile()];
      const { result } = renderHook(() =>
        useFilesSort(files, {
          initialSortBy: "date",
          initialDirection: "asc",
        }),
      );

      expect(result.current.sortBy).toBe("date");
      expect(result.current.sortDirection).toBe("asc");
    });

    it("handles empty files array", () => {
      const { result } = renderHook(() => useFilesSort([]));

      expect(result.current.sortedFiles).toEqual([]);
    });
  });

  describe("sorting by status", () => {
    it("sorts files by status in descending order", () => {
      const files = [
        createMockFile({
          object_name: "file1",
          metadata: { status: "Done" },
        }),
        createMockFile({
          object_name: "file2",
          metadata: { status: "In progress" },
        }),
        createMockFile({
          object_name: "file3",
          metadata: { status: "Review" },
        }),
      ];

      const { result } = renderHook(() =>
        useFilesSort(files, {
          initialSortBy: "status",
          initialDirection: "desc",
        }),
      );

      expect(result.current.sortedFiles[0].metadata?.status).toBe("Review");
      expect(result.current.sortedFiles[1].metadata?.status).toBe(
        "In progress",
      );
      expect(result.current.sortedFiles[2].metadata?.status).toBe("Done");
    });

    it("sorts files by status in ascending order", () => {
      const files = [
        createMockFile({
          object_name: "file1",
          metadata: { status: "Done" },
        }),
        createMockFile({
          object_name: "file2",
          metadata: { status: "Review" },
        }),
        createMockFile({
          object_name: "file3",
          metadata: { status: "In progress" },
        }),
      ];

      const { result } = renderHook(() =>
        useFilesSort(files, {
          initialSortBy: "status",
          initialDirection: "asc",
        }),
      );

      expect(result.current.sortedFiles[0].metadata?.status).toBe("Done");
      expect(result.current.sortedFiles[1].metadata?.status).toBe(
        "In progress",
      );
      expect(result.current.sortedFiles[2].metadata?.status).toBe("Review");
    });

    it("handles files with missing status", () => {
      const files = [
        createMockFile({
          object_name: "file1",
          metadata: { status: "Done" },
        }),
        createMockFile({
          object_name: "file2",
          metadata: undefined,
        }),
        createMockFile({
          object_name: "file3",
          metadata: { status: "Review" },
        }),
      ];

      const { result } = renderHook(() =>
        useFilesSort(files, {
          initialSortBy: "status",
          initialDirection: "asc",
        }),
      );

      // File without status should get default "In progress"
      expect(result.current.sortedFiles).toHaveLength(3);
      expect(result.current.sortedFiles[0].metadata?.status).toBe("Done");
      expect(result.current.sortedFiles[2].metadata?.status).toBe("Review");
    });
  });

  describe("sorting by uploader", () => {
    it("sorts files by uploader in ascending order", () => {
      const files = [
        createMockFile({ object_name: "file1", owner: "charlie@example.com" }),
        createMockFile({ object_name: "file2", owner: "alice@example.com" }),
        createMockFile({ object_name: "file3", owner: "bob@example.com" }),
      ];

      const { result } = renderHook(() =>
        useFilesSort(files, {
          initialSortBy: "uploader",
          initialDirection: "asc",
        }),
      );

      expect(result.current.sortedFiles[0].owner).toBe("alice@example.com");
      expect(result.current.sortedFiles[1].owner).toBe("bob@example.com");
      expect(result.current.sortedFiles[2].owner).toBe("charlie@example.com");
    });

    it("sorts files by uploader in descending order", () => {
      const files = [
        createMockFile({ object_name: "file1", owner: "alice@example.com" }),
        createMockFile({ object_name: "file2", owner: "charlie@example.com" }),
        createMockFile({ object_name: "file3", owner: "bob@example.com" }),
      ];

      const { result } = renderHook(() =>
        useFilesSort(files, {
          initialSortBy: "uploader",
          initialDirection: "desc",
        }),
      );

      expect(result.current.sortedFiles[0].owner).toBe("charlie@example.com");
      expect(result.current.sortedFiles[1].owner).toBe("bob@example.com");
      expect(result.current.sortedFiles[2].owner).toBe("alice@example.com");
    });

    it("handles case-insensitive sorting", () => {
      const files = [
        createMockFile({ object_name: "file1", owner: "CHARLIE@example.com" }),
        createMockFile({ object_name: "file2", owner: "alice@example.com" }),
        createMockFile({ object_name: "file3", owner: "Bob@example.com" }),
      ];

      const { result } = renderHook(() =>
        useFilesSort(files, {
          initialSortBy: "uploader",
          initialDirection: "asc",
        }),
      );

      expect(result.current.sortedFiles[0].owner).toBe("alice@example.com");
      expect(result.current.sortedFiles[1].owner).toBe("Bob@example.com");
      expect(result.current.sortedFiles[2].owner).toBe("CHARLIE@example.com");
    });

    it("handles files with null/undefined owner", () => {
      const files = [
        createMockFile({ object_name: "file1", owner: "bob@example.com" }),
        createMockFile({ object_name: "file2", owner: undefined as any }),
        createMockFile({ object_name: "file3", owner: "alice@example.com" }),
      ];

      const { result } = renderHook(() =>
        useFilesSort(files, {
          initialSortBy: "uploader",
          initialDirection: "asc",
        }),
      );

      expect(result.current.sortedFiles).toHaveLength(3);
    });
  });

  describe("sorting by date", () => {
    it("sorts files by date in ascending order", () => {
      const files = [
        createMockFile({
          object_name: "file1",
          upload_time: "2024-03-01T00:00:00Z",
        }),
        createMockFile({
          object_name: "file2",
          upload_time: "2024-01-01T00:00:00Z",
        }),
        createMockFile({
          object_name: "file3",
          upload_time: "2024-02-01T00:00:00Z",
        }),
      ];

      const { result } = renderHook(() =>
        useFilesSort(files, { initialSortBy: "date", initialDirection: "asc" }),
      );

      expect(result.current.sortedFiles[0].upload_time).toBe(
        "2024-01-01T00:00:00Z",
      );
      expect(result.current.sortedFiles[1].upload_time).toBe(
        "2024-02-01T00:00:00Z",
      );
      expect(result.current.sortedFiles[2].upload_time).toBe(
        "2024-03-01T00:00:00Z",
      );
    });

    it("sorts files by date in descending order", () => {
      const files = [
        createMockFile({
          object_name: "file1",
          upload_time: "2024-01-01T00:00:00Z",
        }),
        createMockFile({
          object_name: "file2",
          upload_time: "2024-03-01T00:00:00Z",
        }),
        createMockFile({
          object_name: "file3",
          upload_time: "2024-02-01T00:00:00Z",
        }),
      ];

      const { result } = renderHook(() =>
        useFilesSort(files, {
          initialSortBy: "date",
          initialDirection: "desc",
        }),
      );

      expect(result.current.sortedFiles[0].upload_time).toBe(
        "2024-03-01T00:00:00Z",
      );
      expect(result.current.sortedFiles[1].upload_time).toBe(
        "2024-02-01T00:00:00Z",
      );
      expect(result.current.sortedFiles[2].upload_time).toBe(
        "2024-01-01T00:00:00Z",
      );
    });

    it("handles invalid dates by treating them as epoch", () => {
      const files = [
        createMockFile({
          object_name: "file1",
          upload_time: "2024-01-01T00:00:00Z",
        }),
        createMockFile({
          object_name: "file2",
          upload_time: "invalid-date" as any,
        }),
        createMockFile({
          object_name: "file3",
          upload_time: "2024-02-01T00:00:00Z",
        }),
      ];

      const { result } = renderHook(() =>
        useFilesSort(files, { initialSortBy: "date", initialDirection: "asc" }),
      );

      // Invalid date (treated as 0) should come first in ascending order
      expect(result.current.sortedFiles[0].object_name).toBe("file2");
      expect(result.current.sortedFiles[1].upload_time).toBe(
        "2024-01-01T00:00:00Z",
      );
      expect(result.current.sortedFiles[2].upload_time).toBe(
        "2024-02-01T00:00:00Z",
      );
    });
  });

  describe("handleSortChange", () => {
    it("changes sort field and resets to descending", () => {
      const files = [createMockFile()];
      const { result } = renderHook(() =>
        useFilesSort(files, {
          initialSortBy: "status",
          initialDirection: "asc",
        }),
      );

      expect(result.current.sortBy).toBe("status");
      expect(result.current.sortDirection).toBe("asc");

      act(() => {
        result.current.handleSortChange("date");
      });

      expect(result.current.sortBy).toBe("date");
      expect(result.current.sortDirection).toBe("desc");
    });

    it("toggles sort direction when clicking same field", () => {
      const files = [createMockFile()];
      const { result } = renderHook(() =>
        useFilesSort(files, {
          initialSortBy: "status",
          initialDirection: "desc",
        }),
      );

      expect(result.current.sortDirection).toBe("desc");

      act(() => {
        result.current.handleSortChange("status");
      });

      expect(result.current.sortBy).toBe("status");
      expect(result.current.sortDirection).toBe("asc");

      act(() => {
        result.current.handleSortChange("status");
      });

      expect(result.current.sortDirection).toBe("desc");
    });
  });

  describe("setSortBy and setSortDirection", () => {
    it("allows manual control of sortBy", () => {
      const files = [createMockFile()];
      const { result } = renderHook(() => useFilesSort(files));

      expect(result.current.sortBy).toBe("status");

      act(() => {
        result.current.setSortBy("uploader");
      });

      expect(result.current.sortBy).toBe("uploader");
    });

    it("allows manual control of sortDirection", () => {
      const files = [createMockFile()];
      const { result } = renderHook(() => useFilesSort(files));

      expect(result.current.sortDirection).toBe("desc");

      act(() => {
        result.current.setSortDirection("asc");
      });

      expect(result.current.sortDirection).toBe("asc");
    });
  });

  describe("memoization", () => {
    it("returns same sortedFiles reference when files and sort params unchanged", () => {
      const files = [createMockFile()];
      const { result, rerender } = renderHook(() => useFilesSort(files));

      const firstResult = result.current.sortedFiles;

      rerender();

      expect(result.current.sortedFiles).toBe(firstResult);
    });

    it("returns new sortedFiles reference when files change", () => {
      const files1 = [createMockFile({ object_name: "file1" })];
      const files2 = [createMockFile({ object_name: "file2" })];

      const { result, rerender } = renderHook(
        ({ files }) => useFilesSort(files),
        { initialProps: { files: files1 } },
      );

      const firstResult = result.current.sortedFiles;

      rerender({ files: files2 });

      expect(result.current.sortedFiles).not.toBe(firstResult);
      expect(result.current.sortedFiles[0].object_name).toBe("file2");
    });

    it("returns new sortedFiles reference when sort params change", () => {
      const files = [
        createMockFile({ object_name: "file1", owner: "bob@example.com" }),
        createMockFile({ object_name: "file2", owner: "alice@example.com" }),
      ];

      const { result } = renderHook(() => useFilesSort(files));

      const firstResult = result.current.sortedFiles;

      act(() => {
        result.current.setSortBy("uploader");
      });

      expect(result.current.sortedFiles).not.toBe(firstResult);
    });
  });
});
