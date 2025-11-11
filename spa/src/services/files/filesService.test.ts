import { describe, it, expect, vi, beforeEach } from "vitest";
import { FilesService } from "./filesService";
import type { IApiClient } from "@/types/services/api";
import type { User, File } from "@/types";
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
  ApplicationError,
} from "@/errors/api";

describe("FilesService", () => {
  let filesService: FilesService;
  let mockApiClient: IApiClient;

  beforeEach(() => {
    mockApiClient = {
      request: vi.fn(),
      setAuth: vi.fn(),
    };
    filesService = new FilesService(mockApiClient);
  });

  describe("uploadFile", () => {
    it("uploads a file with metadata", async () => {
      const mockFile = new File(["content"], "test.txt", {
        type: "text/plain",
      });
      const metadata = { description: "Test file" };

      vi.mocked(mockApiClient.request).mockResolvedValueOnce({ success: true });

      await filesService.uploadFile(mockFile, "test-collection", metadata);

      expect(mockApiClient.request).toHaveBeenCalledWith(
        "/api/files/test-collection",
        expect.objectContaining({
          method: "POST",
          body: expect.any(FormData),
        }),
      );

      const formData = vi.mocked(mockApiClient.request).mock.calls[0][1]
        ?.body as FormData;
      expect(formData.get("file")).toBe(mockFile);
      expect(formData.get("metadata")).toBe(JSON.stringify(metadata));
    });

    it("throws ApplicationError on ValidationError", async () => {
      const mockFile = new File(["content"], "test.txt");
      vi.mocked(mockApiClient.request).mockRejectedValueOnce(
        new ValidationError("Invalid file"),
      );

      await expect(
        filesService.uploadFile(mockFile, "test-collection"),
      ).rejects.toThrow(ApplicationError);
    });

    it("throws ApplicationError on ForbiddenError", async () => {
      const mockFile = new File(["content"], "test.txt");
      vi.mocked(mockApiClient.request).mockRejectedValueOnce(
        new ForbiddenError("No access"),
      );

      await expect(
        filesService.uploadFile(mockFile, "test-collection"),
      ).rejects.toThrow(ApplicationError);
    });

    it("throws ApplicationError on other errors", async () => {
      const mockFile = new File(["content"], "test.txt");
      vi.mocked(mockApiClient.request).mockRejectedValueOnce(
        new Error("Network error"),
      );

      await expect(
        filesService.uploadFile(mockFile, "test-collection"),
      ).rejects.toThrow(ApplicationError);
    });
  });

  describe("listFiles", () => {
    const mockFiles: File[] = [
      {
        object_name: "file1.txt",
        collection: "test",
        owner: "user1",
        original_filename: "file1.txt",
        upload_time: "20251020",
        content_type: "text/plain",
        size: 100,
        metadata: { status: "active" },
      },
      {
        object_name: "file2.txt",
        collection: "test",
        owner: "user2",
        original_filename: "file2.txt",
        upload_time: "20251021",
        content_type: "text/plain",
        size: 200,
        metadata: { status: "archived" },
      },
    ];

    it("lists files with pagination", async () => {
      vi.mocked(mockApiClient.request).mockResolvedValueOnce({
        files: mockFiles,
      });

      const result = await filesService.listFiles("test", 1, 1);

      expect(result.files).toHaveLength(1);
      expect(result.totalCount).toBe(2);
      expect(result.totalPages).toBe(2);
      expect(result.currentPage).toBe(1);
      expect(result.pageSize).toBe(1);
    });

    it("normalizes upload_time from YYYYMMDD format", async () => {
      vi.mocked(mockApiClient.request).mockResolvedValueOnce({
        files: mockFiles,
      });

      const result = await filesService.listFiles("test");

      expect(result.files[0].upload_time).toBe("2025-10-20T00:00:00Z");
      expect(result.files[1].upload_time).toBe("2025-10-21T00:00:00Z");
    });

    it("filters by uploaders", async () => {
      vi.mocked(mockApiClient.request).mockResolvedValueOnce({
        files: mockFiles,
      });

      const result = await filesService.listFiles("test", 1, 10, {
        uploaders: ["user1"],
      });

      expect(result.files).toHaveLength(1);
      expect(result.files[0].owner).toBe("user1");
    });

    it("filters by statuses", async () => {
      vi.mocked(mockApiClient.request).mockResolvedValueOnce({
        files: mockFiles,
      });

      const result = await filesService.listFiles("test", 1, 10, {
        statuses: ["active"],
      });

      expect(result.files).toHaveLength(1);
      expect(result.files[0].metadata?.status).toBe("active");
    });

    it("filters by date range", async () => {
      vi.mocked(mockApiClient.request).mockResolvedValueOnce({
        files: mockFiles,
      });

      const result = await filesService.listFiles("test", 1, 10, {
        dateRange: { start: "2025-10-20", end: "2025-10-20" },
      });

      expect(result.files).toHaveLength(1);
      expect(result.files[0].original_filename).toBe("file1.txt");
    });

    it("throws ApplicationError on NotFoundError", async () => {
      vi.mocked(mockApiClient.request).mockRejectedValueOnce(
        new NotFoundError("Collection not found"),
      );

      await expect(filesService.listFiles("test")).rejects.toThrow(
        ApplicationError,
      );
    });

    it("throws ApplicationError on ForbiddenError", async () => {
      vi.mocked(mockApiClient.request).mockRejectedValueOnce(
        new ForbiddenError("No access"),
      );

      await expect(filesService.listFiles("test")).rejects.toThrow(
        ApplicationError,
      );
    });
  });

  describe("downloadFile", () => {
    it("downloads a file", async () => {
      const mockResponse = new Response("file content");
      vi.mocked(mockApiClient.request).mockResolvedValueOnce(mockResponse);

      const result = await filesService.downloadFile("test", "file.txt");

      expect(result).toBe(mockResponse);
      expect(mockApiClient.request).toHaveBeenCalledWith(
        "/api/files/test/file.txt",
      );
    });

    it("throws ApplicationError on NotFoundError", async () => {
      vi.mocked(mockApiClient.request).mockRejectedValueOnce(
        new NotFoundError("File not found"),
      );

      await expect(
        filesService.downloadFile("test", "file.txt"),
      ).rejects.toThrow(ApplicationError);
    });

    it("throws ApplicationError on ForbiddenError", async () => {
      vi.mocked(mockApiClient.request).mockRejectedValueOnce(
        new ForbiddenError("No access"),
      );

      await expect(
        filesService.downloadFile("test", "file.txt"),
      ).rejects.toThrow(ApplicationError);
    });
  });

  describe("deleteFile", () => {
    it("deletes a file", async () => {
      vi.mocked(mockApiClient.request).mockResolvedValueOnce({ success: true });

      await filesService.deleteFile("test", "file.txt");

      expect(mockApiClient.request).toHaveBeenCalledWith(
        "/api/files/test/file.txt",
        { method: "DELETE" },
      );
    });

    it("throws ApplicationError on NotFoundError", async () => {
      vi.mocked(mockApiClient.request).mockRejectedValueOnce(
        new NotFoundError("File not found"),
      );

      await expect(filesService.deleteFile("test", "file.txt")).rejects.toThrow(
        ApplicationError,
      );
    });

    it("throws ApplicationError on ForbiddenError", async () => {
      vi.mocked(mockApiClient.request).mockRejectedValueOnce(
        new ForbiddenError("No access"),
      );

      await expect(filesService.deleteFile("test", "file.txt")).rejects.toThrow(
        ApplicationError,
      );
    });
  });

  describe("archiveFile", () => {
    it("archives a file", async () => {
      vi.mocked(mockApiClient.request).mockResolvedValueOnce({ success: true });

      await filesService.archiveFile("test", "file.txt");

      expect(mockApiClient.request).toHaveBeenCalledWith(
        "/api/files/test/file.txt",
        {
          method: "PATCH",
          body: JSON.stringify({ archived: true }),
        },
      );
    });

    it("throws ApplicationError on NotFoundError", async () => {
      vi.mocked(mockApiClient.request).mockRejectedValueOnce(
        new NotFoundError("File not found"),
      );

      await expect(
        filesService.archiveFile("test", "file.txt"),
      ).rejects.toThrow(ApplicationError);
    });

    it("throws ApplicationError on ForbiddenError", async () => {
      vi.mocked(mockApiClient.request).mockRejectedValueOnce(
        new ForbiddenError("No access"),
      );

      await expect(
        filesService.archiveFile("test", "file.txt"),
      ).rejects.toThrow(ApplicationError);
    });
  });

  describe("getRecentFiles", () => {
    const mockUser: User = {
      username: "testuser",
      name: "Test User",
      email: "test@example.com",
      roles: [],
      collections: {
        collection1: ["read"],
        collection2: ["read"],
      },
    };

    const mockFiles1: File[] = [
      {
        object_name: "file1.txt",
        collection: "collection1",
        owner: "user1",
        original_filename: "file1.txt",
        upload_time: "2025-10-20T10:00:00Z",
        content_type: "text/plain",
        size: 100,
      },
    ];

    const mockFiles2: File[] = [
      {
        object_name: "file2.txt",
        collection: "collection2",
        owner: "user2",
        original_filename: "file2.txt",
        upload_time: "2025-10-21T10:00:00Z",
        content_type: "text/plain",
        size: 200,
      },
    ];

    it("fetches recent files from all collections", async () => {
      vi.mocked(mockApiClient.request)
        .mockResolvedValueOnce({ files: mockFiles1 })
        .mockResolvedValueOnce({ files: mockFiles2 });

      const result = await filesService.getRecentFiles(mockUser, 10);

      expect(result.files).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
      // Should be sorted by upload_time descending
      expect(result.files[0].original_filename).toBe("file2.txt");
      expect(result.files[1].original_filename).toBe("file1.txt");
    });

    it("limits the number of files returned", async () => {
      vi.mocked(mockApiClient.request)
        .mockResolvedValueOnce({ files: mockFiles1 })
        .mockResolvedValueOnce({ files: mockFiles2 });

      const result = await filesService.getRecentFiles(mockUser, 1);

      expect(result.files).toHaveLength(1);
      expect(result.files[0].original_filename).toBe("file2.txt");
    });

    it("handles partial failures gracefully", async () => {
      vi.mocked(mockApiClient.request)
        .mockResolvedValueOnce({ files: mockFiles1 })
        .mockRejectedValueOnce(new ForbiddenError("No access"));

      const result = await filesService.getRecentFiles(mockUser, 10);

      expect(result.files).toHaveLength(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain("collection2");
    });

    it("returns empty array when user has no collections", async () => {
      const userWithNoCollections: User = {
        ...mockUser,
        collections: {},
      };

      const result = await filesService.getRecentFiles(userWithNoCollections);

      expect(result.files).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });
  });
});
