import { renderHook, act } from "@testing-library/react";
import { useBulkFileActions } from "./useBulkFileActions";
import { toast } from "sonner";
import type { File } from "@/types";

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe("useBulkFileActions", () => {
  const mockDownloadFiles = vi.fn();

  const mockFiles: File[] = [
    {
      object_name: "user/file1.txt",
      original_filename: "file1.txt",
      collection: "test-collection",
      owner: "user1@example.com",
      upload_time: "2024-01-01T00:00:00Z",
      size: 1024,
      content_type: "text/plain",
      metadata: {},
    },
    {
      object_name: "user/file2.txt",
      original_filename: "file2.txt",
      collection: "test-collection",
      owner: "user2@example.com",
      upload_time: "2024-01-02T00:00:00Z",
      size: 2048,
      content_type: "text/plain",
      metadata: {},
    },
    {
      object_name: "user/file3.txt",
      original_filename: "file3.txt",
      collection: "test-collection",
      owner: "user1@example.com",
      upload_time: "2024-01-03T00:00:00Z",
      size: 3072,
      content_type: "text/plain",
      metadata: {},
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with list view mode", () => {
    const { result } = renderHook(() =>
      useBulkFileActions({
        selectedFiles: new Set(),
        files: mockFiles,
        downloadFiles: mockDownloadFiles,
      }),
    );

    expect(result.current.viewMode).toBe("list");
  });

  it("should show error when trying to download with no files selected", () => {
    const { result } = renderHook(() =>
      useBulkFileActions({
        selectedFiles: new Set(),
        files: mockFiles,
        downloadFiles: mockDownloadFiles,
      }),
    );

    act(() => {
      result.current.handleBulkDownload();
    });

    expect(toast.error).toHaveBeenCalledWith("No files selected", {
      description: "Please select files to download",
    });
    expect(mockDownloadFiles).not.toHaveBeenCalled();
  });

  it("should download selected files using context downloadFiles", () => {
    const selectedFiles = new Set(["user/file1.txt", "user/file2.txt"]);

    const { result } = renderHook(() =>
      useBulkFileActions({
        selectedFiles,
        files: mockFiles,
        downloadFiles: mockDownloadFiles,
      }),
    );

    act(() => {
      result.current.handleBulkDownload();
    });

    expect(mockDownloadFiles).toHaveBeenCalledTimes(1);
    expect(mockDownloadFiles).toHaveBeenCalledWith([
      { collection: "test-collection", objectName: "user/file1.txt" },
      { collection: "test-collection", objectName: "user/file2.txt" },
    ]);
  });

  it("should download single file", () => {
    const selectedFiles = new Set(["user/file1.txt"]);

    const { result } = renderHook(() =>
      useBulkFileActions({
        selectedFiles,
        files: mockFiles,
        downloadFiles: mockDownloadFiles,
      }),
    );

    act(() => {
      result.current.handleBulkDownload();
    });

    expect(mockDownloadFiles).toHaveBeenCalledWith([
      { collection: "test-collection", objectName: "user/file1.txt" },
    ]);
  });

  it("should show error when trying to change status with no files selected", () => {
    const { result } = renderHook(() =>
      useBulkFileActions({
        selectedFiles: new Set(),
        files: mockFiles,
        downloadFiles: mockDownloadFiles,
      }),
    );

    act(() => {
      result.current.handleBulkChangeStatus();
    });

    expect(toast.error).toHaveBeenCalledWith("No files selected", {
      description: "Please select files to change status",
    });
  });

  it("should show TODO message for bulk status change", () => {
    const selectedFiles = new Set(["user/file1.txt", "user/file2.txt"]);

    const { result } = renderHook(() =>
      useBulkFileActions({
        selectedFiles,
        files: mockFiles,
        downloadFiles: mockDownloadFiles,
      }),
    );

    act(() => {
      result.current.handleBulkChangeStatus();
    });

    expect(toast.info).toHaveBeenCalledWith(
      "TODO: Bulk status change not yet implemented",
      {
        description: "Would change status for 2 files",
      },
    );
  });

  it("should show TODO message for bulk status change with singular message", () => {
    const selectedFiles = new Set(["user/file1.txt"]);

    const { result } = renderHook(() =>
      useBulkFileActions({
        selectedFiles,
        files: mockFiles,
        downloadFiles: mockDownloadFiles,
      }),
    );

    act(() => {
      result.current.handleBulkChangeStatus();
    });

    expect(toast.info).toHaveBeenCalledWith(
      "TODO: Bulk status change not yet implemented",
      {
        description: "Would change status for 1 file",
      },
    );
  });

  it("should change view mode to grid", () => {
    const { result } = renderHook(() =>
      useBulkFileActions({
        selectedFiles: new Set(),
        files: mockFiles,
        downloadFiles: mockDownloadFiles,
      }),
    );

    act(() => {
      result.current.handleViewModeChange("grid");
    });

    expect(result.current.viewMode).toBe("grid");
    expect(toast.info).toHaveBeenCalledWith(
      "TODO: View mode toggle not yet implemented",
      {
        description: "Would switch to grid view",
      },
    );
  });

  it("should change view mode to list", () => {
    const { result } = renderHook(() =>
      useBulkFileActions({
        selectedFiles: new Set(),
        files: mockFiles,
        downloadFiles: mockDownloadFiles,
      }),
    );

    act(() => {
      result.current.handleViewModeChange("grid");
    });

    act(() => {
      result.current.handleViewModeChange("list");
    });

    expect(result.current.viewMode).toBe("list");
    expect(toast.info).toHaveBeenCalledWith(
      "TODO: View mode toggle not yet implemented",
      {
        description: "Would switch to list view",
      },
    );
  });

  it("should handle selection changes", () => {
    const { result, rerender } = renderHook(
      ({ selectedFiles }) =>
        useBulkFileActions({
          selectedFiles,
          files: mockFiles,
          downloadFiles: mockDownloadFiles,
        }),
      { initialProps: { selectedFiles: new Set(["user/file1.txt"]) } },
    );

    act(() => {
      result.current.handleBulkDownload();
    });

    expect(mockDownloadFiles).toHaveBeenCalledWith([
      { collection: "test-collection", objectName: "user/file1.txt" },
    ]);

    vi.clearAllMocks();

    rerender({
      selectedFiles: new Set([
        "user/file1.txt",
        "user/file2.txt",
        "user/file3.txt",
      ]),
    });

    act(() => {
      result.current.handleBulkDownload();
    });

    expect(mockDownloadFiles).toHaveBeenCalledWith([
      { collection: "test-collection", objectName: "user/file1.txt" },
      { collection: "test-collection", objectName: "user/file2.txt" },
      { collection: "test-collection", objectName: "user/file3.txt" },
    ]);
  });

  it("should only download files that exist in the files array", () => {
    const selectedFiles = new Set(["user/file1.txt", "user/nonexistent.txt"]);

    const { result } = renderHook(() =>
      useBulkFileActions({
        selectedFiles,
        files: mockFiles,
        downloadFiles: mockDownloadFiles,
      }),
    );

    act(() => {
      result.current.handleBulkDownload();
    });

    // Should only download file1.txt, not the nonexistent one
    expect(mockDownloadFiles).toHaveBeenCalledWith([
      { collection: "test-collection", objectName: "user/file1.txt" },
    ]);
  });
});
