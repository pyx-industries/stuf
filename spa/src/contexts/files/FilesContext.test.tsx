import { ApplicationError } from "@/errors/api";
import { useUser } from "@/hooks/user/useUser";
import * as utils from "@/lib/utils";
import filesService from "@/services/files";
import type { File, ServiceError, User } from "@/types";
import { renderHook, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FilesProvider, useFiles } from "./FilesContext";

// Helper function to create mock files
function createMockFile(overrides: Partial<File> = {}): File {
  return {
    object_name: "file.pdf",
    collection: "collection-1",
    original_filename: "file.pdf",
    content_type: "application/pdf",
    owner: "user1",
    upload_time: "2024-01-01T00:00:00Z",
    size: 1024,
    metadata: {},
    ...overrides,
  };
}

// Mock dependencies
vi.mock("@/hooks/user/useUser");
vi.mock("@/services/files");
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));
vi.mock("@/lib/utils", async () => {
  const actual = await vi.importActual("@/lib/utils");
  return {
    ...actual,
    downloadBlob: vi.fn(),
  };
});

// Helper to render hook with provider
function renderWithProvider() {
  return renderHook(() => useFiles(), {
    wrapper: ({ children }) => <FilesProvider>{children}</FilesProvider>,
  });
}

describe("FilesContext", () => {
  const mockUser: User = {
    username: "testuser",
    name: "Test User",
    email: "test@example.com",
    collections: {
      "collection-1": ["read", "write"],
      "collection-2": ["read"],
    },
    roles: [],
  };

  const mockFiles: File[] = [
    createMockFile({
      object_name: "file1.pdf",
      original_filename: "file1.pdf",
    }),
    createMockFile({
      object_name: "file2.csv",
      original_filename: "file2.csv",
      content_type: "text/csv",
      size: 2048,
      upload_time: "2024-01-02T00:00:00Z",
      owner: "user2",
    }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useUser).mockReturnValue(mockUser);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("useFiles hook", () => {
    it("throws error when used outside FilesProvider", () => {
      // Suppress console error for this test
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        renderHook(() => useFiles());
      }).toThrow("useFiles must be used within a FilesProvider");

      consoleSpy.mockRestore();
    });

    it("returns context value when used within provider", () => {
      const { result } = renderWithProvider();

      expect(result.current).toBeDefined();
      expect(result.current.files).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.totalPages).toBe(0);
      expect(result.current.currentPage).toBe(1);
      expect(result.current.totalCount).toBe(0);
      expect(typeof result.current.fetchFiles).toBe("function");
      expect(typeof result.current.fetchRecentFiles).toBe("function");
      expect(typeof result.current.uploadFile).toBe("function");
      expect(typeof result.current.deleteFile).toBe("function");
      expect(typeof result.current.downloadFile).toBe("function");
      expect(typeof result.current.downloadFiles).toBe("function");
    });
  });

  describe("initial state", () => {
    it("starts with correct initial values", () => {
      const { result } = renderWithProvider();

      expect(result.current.files).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.totalPages).toBe(0);
      expect(result.current.currentPage).toBe(1);
      expect(result.current.totalCount).toBe(0);
    });
  });

  describe("fetchFiles", () => {
    it("fetches and sets files successfully", async () => {
      vi.mocked(filesService.listFiles).mockResolvedValue({
        files: mockFiles,
        totalPages: 1,
        currentPage: 1,
        totalCount: 2,
        pageSize: 10,
      });

      const { result } = renderWithProvider();

      result.current.fetchFiles("collection-1");

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.files).toEqual(mockFiles);
        expect(result.current.totalPages).toBe(1);
        expect(result.current.currentPage).toBe(1);
        expect(result.current.totalCount).toBe(2);
        expect(result.current.error).toBe(null);
      });

      expect(filesService.listFiles).toHaveBeenCalledWith(
        "collection-1",
        1,
        10,
        undefined,
      );
    });

    it("handles pagination parameters", async () => {
      vi.mocked(filesService.listFiles).mockResolvedValue({
        files: mockFiles,
        totalPages: 5,
        currentPage: 3,
        totalCount: 50,
        pageSize: 10,
      });

      const { result } = renderWithProvider();

      result.current.fetchFiles("collection-1", 3, 10);

      await waitFor(() => {
        expect(result.current.currentPage).toBe(3);
        expect(result.current.totalPages).toBe(5);
        expect(result.current.totalCount).toBe(50);
      });

      expect(filesService.listFiles).toHaveBeenCalledWith(
        "collection-1",
        3,
        10,
        undefined,
      );
    });

    it("handles filters parameter", async () => {
      const filters = {
        uploaders: ["user1"],
        statuses: ["pending"],
        dateRange: { start: "2024-01-01", end: "2024-01-31" },
      };

      vi.mocked(filesService.listFiles).mockResolvedValue({
        files: [mockFiles[0]],
        totalPages: 1,
        currentPage: 1,
        totalCount: 1,
        pageSize: 10,
      });

      const { result } = renderWithProvider();

      result.current.fetchFiles("collection-1", 1, 10, filters);

      await waitFor(() => {
        expect(filesService.listFiles).toHaveBeenCalledWith(
          "collection-1",
          1,
          10,
          filters,
        );
      });
    });

    it("handles ApplicationError with toast", async () => {
      const error = new ApplicationError(
        "Access denied",
        "Check your permissions",
      );
      vi.mocked(filesService.listFiles).mockRejectedValue(error);

      const { result } = renderWithProvider();

      result.current.fetchFiles("collection-1");

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe("Access denied");
      });

      expect(toast.error).toHaveBeenCalledWith("Access denied", {
        description: "Check your permissions",
      });
    });

    it("throws unexpected errors for error boundary", async () => {
      const unexpectedError = new Error("Unexpected error");
      vi.mocked(filesService.listFiles).mockRejectedValue(unexpectedError);

      const { result } = renderWithProvider();

      await expect(async () => {
        await result.current.fetchFiles("collection-1");
      }).rejects.toThrow("Unexpected error");
    });

    it("resets pagination when changing collection", async () => {
      vi.mocked(filesService.listFiles).mockResolvedValue({
        files: mockFiles,
        totalPages: 5,
        currentPage: 3,
        totalCount: 50,
        pageSize: 10,
      });

      const { result } = renderWithProvider();

      // First fetch with pagination
      result.current.fetchFiles("collection-1", 3, 10);

      await waitFor(() => {
        expect(result.current.currentPage).toBe(3);
      });

      // Change collection - pagination should reset
      vi.mocked(filesService.listFiles).mockResolvedValue({
        files: [mockFiles[0]],
        totalPages: 1,
        currentPage: 1,
        totalCount: 1,
        pageSize: 10,
      });

      result.current.fetchFiles("collection-2", 1, 10);

      await waitFor(() => {
        expect(result.current.currentPage).toBe(1);
        expect(result.current.totalPages).toBe(1);
      });
    });
  });

  describe("fetchRecentFiles", () => {
    describe("when user is not authenticated", () => {
      it("resets state when user is null", async () => {
        vi.mocked(useUser).mockReturnValue(null);

        const { result } = renderWithProvider();

        await result.current.fetchRecentFiles();

        expect(result.current.files).toEqual([]);
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe(null);
        expect(filesService.getRecentFiles).not.toHaveBeenCalled();
      });
    });

    describe("successful fetch", () => {
      it("fetches and sets recent files successfully", async () => {
        vi.mocked(filesService.getRecentFiles).mockResolvedValue({
          files: mockFiles,
          errors: [],
        });

        const { result } = renderWithProvider();

        result.current.fetchRecentFiles(10);

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
          expect(result.current.files).toEqual(mockFiles);
          expect(result.current.error).toBe(null);
        });

        expect(filesService.getRecentFiles).toHaveBeenCalledWith(mockUser, 10);
        expect(toast.error).not.toHaveBeenCalled();
      });

      it("uses default limit when not provided", async () => {
        vi.mocked(filesService.getRecentFiles).mockResolvedValue({
          files: mockFiles,
          errors: [],
        });

        const { result } = renderWithProvider();

        result.current.fetchRecentFiles();

        await waitFor(() => {
          expect(filesService.getRecentFiles).toHaveBeenCalledWith(
            mockUser,
            10,
          );
        });
      });
    });

    describe("partial success", () => {
      it("handles partial success with some files loaded", async () => {
        const errors: ServiceError[] = [
          {
            message: "Failed to fetch files from collection-3",
            action: "Check permissions",
          },
        ];

        vi.mocked(filesService.getRecentFiles).mockResolvedValue({
          files: mockFiles,
          errors,
        });

        const { result } = renderWithProvider();

        result.current.fetchRecentFiles();

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
          expect(result.current.files).toEqual(mockFiles);
          expect(result.current.error).toBe(
            "Failed to fetch files from 1 collection",
          );
        });

        expect(toast.error).toHaveBeenCalledWith(
          "Failed to fetch files from collection-3",
          {
            description: "Check permissions",
          },
        );
      });

      it("shows plural error message for multiple failures", async () => {
        const errors: ServiceError[] = [
          {
            message: "Failed to fetch collection-1",
            action: "Check permissions",
          },
          {
            message: "Failed to fetch collection-2",
            action: "Check permissions",
          },
        ];

        vi.mocked(filesService.getRecentFiles).mockResolvedValue({
          files: mockFiles,
          errors,
        });

        const { result } = renderWithProvider();

        result.current.fetchRecentFiles();

        await waitFor(() => {
          expect(result.current.error).toBe(
            "Failed to fetch files from 2 collections",
          );
        });

        expect(toast.error).toHaveBeenCalledTimes(2);
      });

      it("shows FETCH_ERROR when all collections fail", async () => {
        const errors: ServiceError[] = [
          {
            message: "Failed to fetch collection-1",
            action: "Check permissions",
          },
        ];

        vi.mocked(filesService.getRecentFiles).mockResolvedValue({
          files: [],
          errors,
        });

        const { result } = renderWithProvider();

        result.current.fetchRecentFiles();

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
          expect(result.current.files).toEqual([]);
          expect(result.current.error).toBe("Failed to fetch recent files");
        });
      });
    });
  });

  describe("uploadFile", () => {
    const mockFile = new globalThis.File(["content"], "test.pdf", {
      type: "application/pdf",
    });

    it("uploads file successfully", async () => {
      vi.mocked(filesService.uploadFile).mockResolvedValue();

      const { result } = renderWithProvider();

      await result.current.uploadFile(mockFile, "collection-1");

      expect(filesService.uploadFile).toHaveBeenCalledWith(
        mockFile,
        "collection-1",
        {},
      );
      expect(toast.success).toHaveBeenCalledWith("File uploaded successfully");
    });

    it("uploads file with metadata", async () => {
      vi.mocked(filesService.uploadFile).mockResolvedValue();

      const { result } = renderWithProvider();

      const metadata = { category: "documents", tags: ["important"] };
      await result.current.uploadFile(mockFile, "collection-1", metadata);

      expect(filesService.uploadFile).toHaveBeenCalledWith(
        mockFile,
        "collection-1",
        metadata,
      );
    });

    it("handles ApplicationError with toast", async () => {
      const error = new ApplicationError("Upload failed", "Check file size");
      vi.mocked(filesService.uploadFile).mockRejectedValue(error);

      const { result } = renderWithProvider();

      await expect(
        result.current.uploadFile(mockFile, "collection-1"),
      ).rejects.toThrow();

      expect(toast.error).toHaveBeenCalledWith("Upload failed", {
        description: "Check file size",
      });
    });
  });

  describe("deleteFile", () => {
    it("deletes file successfully", async () => {
      vi.mocked(filesService.deleteFile).mockResolvedValue();

      const { result } = renderWithProvider();

      await result.current.deleteFile("collection-1", "file1.pdf");

      expect(filesService.deleteFile).toHaveBeenCalledWith(
        "collection-1",
        "file1.pdf",
      );
      expect(toast.success).toHaveBeenCalledWith("File deleted successfully");
    });

    it("handles ApplicationError with toast", async () => {
      const error = new ApplicationError("Delete failed", "Check permissions");
      vi.mocked(filesService.deleteFile).mockRejectedValue(error);

      const { result } = renderWithProvider();

      await expect(
        result.current.deleteFile("collection-1", "file1.pdf"),
      ).rejects.toThrow();

      expect(toast.error).toHaveBeenCalledWith("Delete failed", {
        description: "Check permissions",
      });
    });
  });

  describe("archiveFile", () => {
    it("shows TODO toast", async () => {
      const { result } = renderWithProvider();

      await result.current.archiveFile("collection-1", "file1.pdf");

      expect(toast.info).toHaveBeenCalledWith(
        "TODO: Archive functionality not yet implemented",
        {
          description: "Would archive file1.pdf from collection-1",
        },
      );
    });
  });

  describe("downloadFile", () => {
    it("downloads file successfully", async () => {
      const mockResponse = new Response("file content");
      vi.mocked(filesService.downloadFile).mockResolvedValue(mockResponse);

      const { result } = renderWithProvider();

      await result.current.downloadFile("collection-1", "user/file1.pdf");

      expect(filesService.downloadFile).toHaveBeenCalledWith(
        "collection-1",
        "user/file1.pdf",
      );
      expect(utils.downloadBlob).toHaveBeenCalled();
      const call = vi.mocked(utils.downloadBlob).mock.calls[0];
      expect(call[0]).toHaveProperty("size");
      expect(call[0]).toHaveProperty("type");
      expect(call[1]).toBe("file1.pdf");
    });

    it("extracts filename from object path", async () => {
      const mockResponse = new Response("file content");
      vi.mocked(filesService.downloadFile).mockResolvedValue(mockResponse);

      const { result } = renderWithProvider();

      await result.current.downloadFile(
        "collection-1",
        "path/to/nested/file.csv",
      );

      expect(utils.downloadBlob).toHaveBeenCalled();
      const call = vi.mocked(utils.downloadBlob).mock.calls[0];
      expect(call[0]).toHaveProperty("size");
      expect(call[0]).toHaveProperty("type");
      expect(call[1]).toBe("file.csv");
    });

    it("uses default filename when path has no filename", async () => {
      const mockResponse = new Response("file content");
      vi.mocked(filesService.downloadFile).mockResolvedValue(mockResponse);

      const { result } = renderWithProvider();

      await result.current.downloadFile("collection-1", "");

      expect(utils.downloadBlob).toHaveBeenCalled();
      const call = vi.mocked(utils.downloadBlob).mock.calls[0];
      expect(call[0]).toHaveProperty("size");
      expect(call[0]).toHaveProperty("type");
      expect(call[1]).toBe("download");
    });

    it("handles ApplicationError with toast", async () => {
      const error = new ApplicationError("Download failed", "File not found");
      vi.mocked(filesService.downloadFile).mockRejectedValue(error);

      const { result } = renderWithProvider();

      await expect(
        result.current.downloadFile("collection-1", "file1.pdf"),
      ).rejects.toThrow();

      expect(toast.error).toHaveBeenCalledWith("Download failed", {
        description: "File not found",
      });
    });
  });

  describe("downloadFiles", () => {
    it("downloads multiple files successfully", async () => {
      vi.mocked(filesService.downloadFile).mockImplementation(async () => {
        return new Response("file content");
      });

      const { result } = renderWithProvider();

      const filesToDownload = [
        { collection: "collection-1", objectName: "file1.pdf" },
        { collection: "collection-1", objectName: "file2.csv" },
      ];

      await result.current.downloadFiles(filesToDownload);

      expect(filesService.downloadFile).toHaveBeenCalledTimes(2);
      expect(toast.success).toHaveBeenCalledWith(
        "Successfully downloaded 2 files",
      );
    });

    it("handles single file download", async () => {
      const mockResponse = new Response("file content");
      vi.mocked(filesService.downloadFile).mockResolvedValue(mockResponse);

      const { result } = renderWithProvider();

      await result.current.downloadFiles([
        { collection: "collection-1", objectName: "file1.pdf" },
      ]);

      expect(toast.success).toHaveBeenCalledWith(
        "Successfully downloaded 1 file",
      );
    });

    it("handles empty files array", async () => {
      const { result } = renderWithProvider();

      await result.current.downloadFiles([]);

      expect(filesService.downloadFile).not.toHaveBeenCalled();
      expect(toast.success).not.toHaveBeenCalled();
    });

    it("handles partial failures", async () => {
      vi.mocked(filesService.downloadFile)
        .mockResolvedValueOnce(new Response("file content"))
        .mockRejectedValueOnce(new ApplicationError("Failed", "Not found"))
        .mockResolvedValueOnce(new Response("file content"));

      const { result } = renderWithProvider();

      const filesToDownload = [
        { collection: "collection-1", objectName: "file1.pdf" },
        { collection: "collection-1", objectName: "file2.csv" },
        { collection: "collection-1", objectName: "file3.txt" },
      ];

      await result.current.downloadFiles(filesToDownload);

      expect(toast.warning).toHaveBeenCalledWith("Downloaded 2 files", {
        description: "1 file failed to download",
      });
    });

    it("handles all files failing", async () => {
      vi.mocked(filesService.downloadFile).mockRejectedValue(
        new ApplicationError("Failed", "Not found"),
      );

      const { result } = renderWithProvider();

      const filesToDownload = [
        { collection: "collection-1", objectName: "file1.pdf" },
        { collection: "collection-1", objectName: "file2.csv" },
      ];

      await result.current.downloadFiles(filesToDownload);

      expect(toast.error).toHaveBeenCalledWith(
        "Failed to download all 2 files",
      );
    });

    it("downloads files sequentially", async () => {
      const mockResponse = new Response("file content");
      const downloadOrder: string[] = [];

      vi.mocked(filesService.downloadFile).mockImplementation(
        async (_collection, objectName) => {
          downloadOrder.push(objectName);
          return mockResponse;
        },
      );

      const { result } = renderWithProvider();

      const filesToDownload = [
        { collection: "collection-1", objectName: "file1.pdf" },
        { collection: "collection-1", objectName: "file2.csv" },
        { collection: "collection-1", objectName: "file3.txt" },
      ];

      await result.current.downloadFiles(filesToDownload);

      // Verify they were called in order
      expect(downloadOrder).toEqual(["file1.pdf", "file2.csv", "file3.txt"]);
    });
  });

  describe("dependency on user.collections", () => {
    it("recreates fetchRecentFiles when user.collections changes", () => {
      const { result, rerender } = renderWithProvider();
      const firstFetch = result.current.fetchRecentFiles;

      // Change user collections
      vi.mocked(useUser).mockReturnValue({
        ...mockUser,
        collections: {
          "collection-3": ["read"],
        },
      });

      rerender();

      const secondFetch = result.current.fetchRecentFiles;

      expect(firstFetch).not.toBe(secondFetch);
    });

    it("keeps same fetchRecentFiles when user.collections unchanged", () => {
      const { result, rerender } = renderWithProvider();
      const firstFetch = result.current.fetchRecentFiles;

      // Rerender without changing user.collections
      rerender();

      const secondFetch = result.current.fetchRecentFiles;

      expect(firstFetch).toBe(secondFetch);
    });
  });

  describe("memoization", () => {
    it("memoizes context value based on state and functions", async () => {
      vi.mocked(filesService.listFiles).mockResolvedValue({
        files: mockFiles,
        totalPages: 1,
        currentPage: 1,
        totalCount: 2,
        pageSize: 10,
      });

      const { result, rerender } = renderWithProvider();
      const firstValue = result.current;

      // Rerender without state change
      rerender();

      expect(result.current).toBe(firstValue);

      // Trigger state change
      result.current.fetchFiles("collection-1");

      await waitFor(() => {
        expect(result.current).not.toBe(firstValue);
      });
    });
  });
});
