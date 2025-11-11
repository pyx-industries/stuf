import type { File } from "@/types";
import { act, renderHook } from "@testing-library/react";
import { useCollectionFilters } from "./useCollectionFilters";

describe("useCollectionFilters", () => {
  const mockFiles: File[] = [
    {
      object_name: "file1.txt",
      original_filename: "file1.txt",
      collection: "test-collection",
      owner: "user1@example.com",
      upload_time: "2024-01-01T00:00:00Z",
      size: 1024,
      content_type: "text/plain",
      metadata: { status: "In progress" },
    },
    {
      object_name: "file2.txt",
      original_filename: "file2.txt",
      collection: "test-collection",
      owner: "user2@example.com",
      upload_time: "2024-01-02T00:00:00Z",
      size: 2048,
      content_type: "text/plain",
      metadata: { status: "Done" },
    },
    {
      object_name: "file3.txt",
      original_filename: "file3.txt",
      collection: "test-collection",
      owner: "user1@example.com",
      upload_time: "2024-01-03T00:00:00Z",
      size: 3072,
      content_type: "text/plain",
      metadata: { status: "Review" },
    },
  ];

  it("should initialize with empty filters", () => {
    const { result } = renderHook(() =>
      useCollectionFilters({ files: mockFiles }),
    );

    expect(result.current.activeFilters).toEqual([]);
    expect(result.current.currentFilters).toEqual({
      uploaders: undefined,
      statuses: undefined,
      dateRange: undefined,
    });
  });

  it("should extract available uploaders from files", () => {
    const { result } = renderHook(() =>
      useCollectionFilters({ files: mockFiles }),
    );

    expect(result.current.availableUploaders).toEqual([
      "user1@example.com",
      "user2@example.com",
    ]);
  });

  it("should handle uploader filter application", () => {
    const { result } = renderHook(() =>
      useCollectionFilters({ files: mockFiles }),
    );

    act(() => {
      result.current.handleApplyFilters(["user1@example.com"], []);
    });

    expect(result.current.activeFilters).toEqual([
      {
        id: "uploader-user1@example.com",
        label: "Uploader: user1@example.com",
        type: "uploader",
      },
    ]);
    expect(result.current.currentFilters.uploaders).toEqual([
      "user1@example.com",
    ]);
  });

  it("should handle status filter application", () => {
    const { result } = renderHook(() =>
      useCollectionFilters({ files: mockFiles }),
    );

    act(() => {
      result.current.handleApplyFilters([], ["Done", "Review"]);
    });

    expect(result.current.activeFilters).toHaveLength(2);
    expect(result.current.activeFilters).toContainEqual({
      id: "status-Done",
      label: "Status: Done",
      type: "status",
    });
    expect(result.current.activeFilters).toContainEqual({
      id: "status-Review",
      label: "Status: Review",
      type: "status",
    });
    expect(result.current.currentFilters.statuses).toEqual(["Done", "Review"]);
  });

  it("should handle multiple uploaders and statuses", () => {
    const { result } = renderHook(() =>
      useCollectionFilters({ files: mockFiles }),
    );

    act(() => {
      result.current.handleApplyFilters(
        ["user1@example.com", "user2@example.com"],
        ["Done"],
      );
    });

    expect(result.current.activeFilters).toHaveLength(3);
    expect(result.current.currentFilters.uploaders).toEqual([
      "user1@example.com",
      "user2@example.com",
    ]);
    expect(result.current.currentFilters.statuses).toEqual(["Done"]);
  });

  it("should handle date filter application with GB format", () => {
    const { result } = renderHook(() =>
      useCollectionFilters({ files: mockFiles }),
    );

    act(() => {
      result.current.handleApplyDateFilter("2024-01-01", "2024-01-31");
    });

    expect(result.current.activeFilters).toHaveLength(1);
    expect(result.current.activeFilters[0]).toEqual({
      id: "date-2024-01-01-2024-01-31",
      label: "1 Jan 2024 – 31 Jan 2024",
      type: "date",
    });
    expect(result.current.currentFilters.dateRange).toEqual({
      start: "2024-01-01",
      end: "2024-01-31",
    });
  });

  it("should preserve date filter when applying uploader/status filters", () => {
    const { result } = renderHook(() =>
      useCollectionFilters({ files: mockFiles }),
    );

    act(() => {
      result.current.handleApplyDateFilter("2024-01-01", "2024-01-31");
    });

    act(() => {
      result.current.handleApplyFilters(["user1@example.com"], ["Done"]);
    });

    expect(result.current.activeFilters).toHaveLength(3);
    expect(
      result.current.activeFilters.some((f) => f.type === "date"),
    ).toBeTruthy();
    expect(
      result.current.activeFilters.some((f) => f.type === "uploader"),
    ).toBeTruthy();
    expect(
      result.current.activeFilters.some((f) => f.type === "status"),
    ).toBeTruthy();
  });

  it("should replace existing date filter with new one", () => {
    const { result } = renderHook(() =>
      useCollectionFilters({ files: mockFiles }),
    );

    act(() => {
      result.current.handleApplyDateFilter("2024-01-01", "2024-01-31");
    });

    act(() => {
      result.current.handleApplyDateFilter("2024-02-01", "2024-02-28");
    });

    expect(result.current.activeFilters).toHaveLength(1);
    expect(result.current.activeFilters[0].id).toBe(
      "date-2024-02-01-2024-02-28",
    );
    expect(result.current.activeFilters[0].label).toBe(
      "1 Feb 2024 – 28 Feb 2024",
    );
  });

  it("should remove individual filter", () => {
    const { result } = renderHook(() =>
      useCollectionFilters({ files: mockFiles }),
    );

    act(() => {
      result.current.handleApplyFilters(
        ["user1@example.com", "user2@example.com"],
        ["Done"],
      );
    });

    act(() => {
      result.current.handleRemoveFilter("uploader-user1@example.com");
    });

    expect(result.current.activeFilters).toHaveLength(2);
    expect(
      result.current.activeFilters.find(
        (f) => f.id === "uploader-user1@example.com",
      ),
    ).toBeUndefined();
  });

  it("should clear date range when removing date filter", () => {
    const { result } = renderHook(() =>
      useCollectionFilters({ files: mockFiles }),
    );

    act(() => {
      result.current.handleApplyDateFilter("2024-01-01", "2024-01-31");
    });

    act(() => {
      result.current.handleRemoveFilter("date-2024-01-01-2024-01-31");
    });

    expect(result.current.activeFilters).toHaveLength(0);
    expect(result.current.currentFilters.dateRange).toBeUndefined();
  });

  it("should clear all filters", () => {
    const { result } = renderHook(() =>
      useCollectionFilters({ files: mockFiles }),
    );

    act(() => {
      result.current.handleApplyFilters(["user1@example.com"], ["Done"]);
      result.current.handleApplyDateFilter("2024-01-01", "2024-01-31");
    });

    expect(result.current.activeFilters.length).toBeGreaterThan(0);

    act(() => {
      result.current.handleClearAllFilters();
    });

    expect(result.current.activeFilters).toEqual([]);
    expect(result.current.currentFilters).toEqual({
      uploaders: undefined,
      statuses: undefined,
      dateRange: undefined,
    });
  });

  it("should update available uploaders when files change", () => {
    const { result, rerender } = renderHook(
      ({ files }) => useCollectionFilters({ files }),
      { initialProps: { files: mockFiles } },
    );

    expect(result.current.availableUploaders).toEqual([
      "user1@example.com",
      "user2@example.com",
    ]);

    const newFiles: File[] = [
      ...mockFiles,
      {
        object_name: "file4.txt",
        original_filename: "file4.txt",
        collection: "test-collection",
        owner: "user3@example.com",
        upload_time: "2024-01-04T00:00:00Z",
        size: 4096,
        content_type: "text/plain",
        metadata: { status: "Done" },
      },
    ];

    rerender({ files: newFiles });

    expect(result.current.availableUploaders).toEqual([
      "user1@example.com",
      "user2@example.com",
      "user3@example.com",
    ]);
  });

  it("should handle empty files array", () => {
    const { result } = renderHook(() => useCollectionFilters({ files: [] }));

    expect(result.current.availableUploaders).toEqual([]);
    expect(result.current.activeFilters).toEqual([]);
  });
});
