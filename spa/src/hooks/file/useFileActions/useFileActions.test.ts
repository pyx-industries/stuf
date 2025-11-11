import { useFiles } from "@/contexts/files";
import type { File } from "@/types";
import { renderHook, waitFor } from "@testing-library/react";
import { useNavigate } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useFileActions } from ".";

// Mock dependencies
vi.mock("@/contexts/files", () => ({
  useFiles: vi.fn(),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: vi.fn(),
}));

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

describe("useFileActions", () => {
  const mockNavigate = vi.fn();
  const mockDownloadFile = vi.fn();
  const mockDeleteFile = vi.fn();
  const mockArchiveFile = vi.fn();
  const mockRefetchFiles = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    vi.mocked(useFiles).mockReturnValue({
      downloadFile: mockDownloadFile,
      deleteFile: mockDeleteFile,
      archiveFile: mockArchiveFile,
      files: [],
      loading: false,
      error: null,
      fetchFiles: vi.fn(),
      fetchRecentFiles: vi.fn(),
      uploadFile: vi.fn(),
      downloadFiles: vi.fn(),
      totalPages: 0,
      currentPage: 1,
      totalCount: 0,
    });

    mockRefetchFiles.mockResolvedValue(undefined);
  });

  describe("handleDownload", () => {
    it("calls downloadFile with correct parameters", () => {
      const { result } = renderHook(() => useFileActions(mockRefetchFiles));
      const file = createMockFile();

      result.current.handleDownload(file);

      expect(mockDownloadFile).toHaveBeenCalledWith(
        file.collection,
        file.object_name,
      );
    });
  });

  describe("handleViewHistory", () => {
    it("navigates to file detail page with encoded object name", () => {
      const { result } = renderHook(() => useFileActions(mockRefetchFiles));
      const file = createMockFile();

      result.current.handleViewHistory(file);

      expect(mockNavigate).toHaveBeenCalledWith(
        `/collections/${file.collection}/files/${encodeURIComponent(file.object_name)}`,
      );
    });
  });

  describe("delete dialog", () => {
    it("opens delete dialog when handleDelete is called", async () => {
      const { result } = renderHook(() => useFileActions(mockRefetchFiles));
      const file = createMockFile();

      expect(result.current.deleteDialog.open).toBe(false);
      expect(result.current.deleteDialog.file).toBeNull();

      result.current.handleDelete(file);

      await waitFor(() => {
        expect(result.current.deleteDialog.open).toBe(true);
        expect(result.current.deleteDialog.file).toBe(file);
        expect(result.current.deleteDialog.isLoading).toBe(false);
      });
    });

    it("closes delete dialog when onCancel is called", async () => {
      const { result } = renderHook(() => useFileActions(mockRefetchFiles));
      const file = createMockFile();

      result.current.handleDelete(file);

      await waitFor(() => {
        expect(result.current.deleteDialog.open).toBe(true);
      });

      result.current.deleteDialog.onCancel();

      await waitFor(() => {
        expect(result.current.deleteDialog.open).toBe(false);
        expect(result.current.deleteDialog.file).toBeNull();
        expect(result.current.deleteDialog.isLoading).toBe(false);
      });
    });

    it("successfully deletes file and refetches", async () => {
      mockDeleteFile.mockResolvedValue(undefined);

      const { result } = renderHook(() => useFileActions(mockRefetchFiles));
      const file = createMockFile();

      result.current.handleDelete(file);

      await waitFor(() => {
        expect(result.current.deleteDialog.open).toBe(true);
      });

      result.current.deleteDialog.onConfirm();

      await waitFor(() => {
        expect(mockDeleteFile).toHaveBeenCalledWith(
          file.collection,
          file.object_name,
        );
        expect(mockRefetchFiles).toHaveBeenCalled();
        expect(result.current.deleteDialog.open).toBe(false);
        expect(result.current.deleteDialog.file).toBeNull();
        expect(result.current.deleteDialog.isLoading).toBe(false);
      });
    });

    it("sets loading state during deletion", async () => {
      let resolveDelete: () => void;
      const deletePromise = new Promise<void>((resolve) => {
        resolveDelete = resolve;
      });
      mockDeleteFile.mockReturnValue(deletePromise);

      const { result } = renderHook(() => useFileActions(mockRefetchFiles));
      const file = createMockFile();

      result.current.handleDelete(file);

      await waitFor(() => {
        expect(result.current.deleteDialog.open).toBe(true);
      });

      result.current.deleteDialog.onConfirm();

      await waitFor(() => {
        expect(result.current.deleteDialog.isLoading).toBe(true);
      });

      resolveDelete!();
      await deletePromise;

      await waitFor(() => {
        expect(result.current.deleteDialog.isLoading).toBe(false);
      });
    });

    it("closes dialog on deletion error", async () => {
      mockDeleteFile.mockRejectedValue(new Error("Delete failed"));

      const { result } = renderHook(() => useFileActions(mockRefetchFiles));
      const file = createMockFile();

      result.current.handleDelete(file);

      await waitFor(() => {
        expect(result.current.deleteDialog.open).toBe(true);
      });

      result.current.deleteDialog.onConfirm();

      await waitFor(() => {
        expect(mockDeleteFile).toHaveBeenCalled();
        expect(result.current.deleteDialog.open).toBe(false);
        expect(result.current.deleteDialog.file).toBeNull();
        expect(result.current.deleteDialog.isLoading).toBe(false);
      });
    });
  });

  describe("archive dialog", () => {
    it("opens archive dialog when handleArchive is called", async () => {
      const { result } = renderHook(() => useFileActions(mockRefetchFiles));
      const file = createMockFile();

      expect(result.current.archiveDialog.open).toBe(false);
      expect(result.current.archiveDialog.file).toBeNull();

      result.current.handleArchive(file);

      await waitFor(() => {
        expect(result.current.archiveDialog.open).toBe(true);
        expect(result.current.archiveDialog.file).toBe(file);
        expect(result.current.archiveDialog.isLoading).toBe(false);
      });
    });

    it("closes archive dialog when onCancel is called", async () => {
      const { result } = renderHook(() => useFileActions(mockRefetchFiles));
      const file = createMockFile();

      result.current.handleArchive(file);

      await waitFor(() => {
        expect(result.current.archiveDialog.open).toBe(true);
      });

      result.current.archiveDialog.onCancel();

      await waitFor(() => {
        expect(result.current.archiveDialog.open).toBe(false);
        expect(result.current.archiveDialog.file).toBeNull();
        expect(result.current.archiveDialog.isLoading).toBe(false);
      });
    });

    it("successfully archives file and refetches", async () => {
      mockArchiveFile.mockResolvedValue(undefined);

      const { result } = renderHook(() => useFileActions(mockRefetchFiles));
      const file = createMockFile();

      result.current.handleArchive(file);

      await waitFor(() => {
        expect(result.current.archiveDialog.open).toBe(true);
      });

      result.current.archiveDialog.onConfirm();

      await waitFor(() => {
        expect(mockArchiveFile).toHaveBeenCalledWith(
          file.collection,
          file.object_name,
        );
        expect(mockRefetchFiles).toHaveBeenCalled();
        expect(result.current.archiveDialog.open).toBe(false);
        expect(result.current.archiveDialog.file).toBeNull();
        expect(result.current.archiveDialog.isLoading).toBe(false);
      });
    });

    it("sets loading state during archival", async () => {
      let resolveArchive: () => void;
      const archivePromise = new Promise<void>((resolve) => {
        resolveArchive = resolve;
      });
      mockArchiveFile.mockReturnValue(archivePromise);

      const { result } = renderHook(() => useFileActions(mockRefetchFiles));
      const file = createMockFile();

      result.current.handleArchive(file);

      await waitFor(() => {
        expect(result.current.archiveDialog.open).toBe(true);
      });

      result.current.archiveDialog.onConfirm();

      await waitFor(() => {
        expect(result.current.archiveDialog.isLoading).toBe(true);
      });

      resolveArchive!();
      await archivePromise;

      await waitFor(() => {
        expect(result.current.archiveDialog.isLoading).toBe(false);
      });
    });

    it("closes dialog on archive error", async () => {
      mockArchiveFile.mockRejectedValue(new Error("Archive failed"));

      const { result } = renderHook(() => useFileActions(mockRefetchFiles));
      const file = createMockFile();

      result.current.handleArchive(file);

      await waitFor(() => {
        expect(result.current.archiveDialog.open).toBe(true);
      });

      result.current.archiveDialog.onConfirm();

      await waitFor(() => {
        expect(mockArchiveFile).toHaveBeenCalled();
        expect(result.current.archiveDialog.open).toBe(false);
        expect(result.current.archiveDialog.file).toBeNull();
        expect(result.current.archiveDialog.isLoading).toBe(false);
      });
    });
  });

  describe("multiple dialogs", () => {
    it("maintains separate state for each dialog", async () => {
      const { result } = renderHook(() => useFileActions(mockRefetchFiles));
      const file1 = createMockFile({ object_name: "file1.txt" });
      const file2 = createMockFile({ object_name: "file2.txt" });

      result.current.handleDelete(file1);

      await waitFor(() => {
        expect(result.current.deleteDialog.open).toBe(true);
        expect(result.current.deleteDialog.file).toBe(file1);
        expect(result.current.archiveDialog.open).toBe(false);
        expect(result.current.archiveDialog.file).toBeNull();
      });

      result.current.handleArchive(file2);

      await waitFor(() => {
        expect(result.current.archiveDialog.open).toBe(true);
        expect(result.current.archiveDialog.file).toBe(file2);
        expect(result.current.deleteDialog.open).toBe(true);
        expect(result.current.deleteDialog.file).toBe(file1);
      });
    });
  });
});
