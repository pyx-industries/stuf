import type { ActiveFilter } from "@/components/table/table-filters/TableFilters";
import { act, renderHook } from "@testing-library/react";
import { useFilterState } from "./useFilterState";

describe("useFilterState", () => {
  const mockOnApplyFilters = vi.fn();
  const mockOnApplyDateFilter = vi.fn();
  const mockOnRemoveFilter = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with empty state", () => {
    const { result } = renderHook(() =>
      useFilterState({
        activeFilters: [],
        onApplyFilters: mockOnApplyFilters,
        onApplyDateFilter: mockOnApplyDateFilter,
        onRemoveFilter: mockOnRemoveFilter,
      }),
    );

    expect(result.current.selectedUploaders).toEqual([]);
    expect(result.current.selectedStatuses).toEqual([]);
    expect(result.current.dateRange).toEqual({ start: "", end: "" });
    expect(result.current.isFiltersOpen).toBe(false);
  });

  it("should toggle uploader selection", () => {
    const { result } = renderHook(() =>
      useFilterState({
        activeFilters: [],
        onApplyFilters: mockOnApplyFilters,
        onApplyDateFilter: mockOnApplyDateFilter,
        onRemoveFilter: mockOnRemoveFilter,
      }),
    );

    act(() => {
      result.current.toggleUploader("user1");
    });

    expect(result.current.selectedUploaders).toEqual(["user1"]);

    act(() => {
      result.current.toggleUploader("user2");
    });

    expect(result.current.selectedUploaders).toEqual(["user1", "user2"]);

    act(() => {
      result.current.toggleUploader("user1");
    });

    expect(result.current.selectedUploaders).toEqual(["user2"]);
  });

  it("should toggle status selection", () => {
    const { result } = renderHook(() =>
      useFilterState({
        activeFilters: [],
        onApplyFilters: mockOnApplyFilters,
        onApplyDateFilter: mockOnApplyDateFilter,
        onRemoveFilter: mockOnRemoveFilter,
      }),
    );

    act(() => {
      result.current.toggleStatus("In progress");
    });

    expect(result.current.selectedStatuses).toEqual(["In progress"]);

    act(() => {
      result.current.toggleStatus("In progress");
    });

    expect(result.current.selectedStatuses).toEqual([]);
  });

  it("should apply filters and close dropdown", () => {
    const { result } = renderHook(() =>
      useFilterState({
        activeFilters: [],
        onApplyFilters: mockOnApplyFilters,
        onApplyDateFilter: mockOnApplyDateFilter,
        onRemoveFilter: mockOnRemoveFilter,
      }),
    );

    act(() => {
      result.current.toggleUploader("user1");
      result.current.toggleStatus("Done");
      result.current.setDateRange({ start: "2024-01-01", end: "2024-01-31" });
      result.current.setIsFiltersOpen(true);
    });

    act(() => {
      result.current.handleApplyFilters();
    });

    expect(mockOnApplyFilters).toHaveBeenCalledWith(["user1"], ["Done"]);
    expect(mockOnApplyDateFilter).toHaveBeenCalledWith(
      "2024-01-01",
      "2024-01-31",
    );
    expect(result.current.isFiltersOpen).toBe(false);
  });

  it("should handle removing uploader filter", () => {
    const activeFilters: ActiveFilter[] = [
      { id: "uploader-user1", label: "Uploader: user1", type: "uploader" },
    ];

    const { result } = renderHook(() =>
      useFilterState({
        activeFilters,
        onApplyFilters: mockOnApplyFilters,
        onApplyDateFilter: mockOnApplyDateFilter,
        onRemoveFilter: mockOnRemoveFilter,
      }),
    );

    act(() => {
      result.current.toggleUploader("user1");
    });

    expect(result.current.selectedUploaders).toEqual(["user1"]);

    act(() => {
      result.current.handleRemoveFilter("uploader-user1");
    });

    expect(result.current.selectedUploaders).toEqual([]);
    expect(mockOnRemoveFilter).toHaveBeenCalledWith("uploader-user1");
  });

  it("should handle removing status filter", () => {
    const activeFilters: ActiveFilter[] = [
      { id: "status-Done", label: "Status: Done", type: "status" },
    ];

    const { result } = renderHook(() =>
      useFilterState({
        activeFilters,
        onApplyFilters: mockOnApplyFilters,
        onApplyDateFilter: mockOnApplyDateFilter,
        onRemoveFilter: mockOnRemoveFilter,
      }),
    );

    act(() => {
      result.current.toggleStatus("Done");
    });

    expect(result.current.selectedStatuses).toEqual(["Done"]);

    act(() => {
      result.current.handleRemoveFilter("status-Done");
    });

    expect(result.current.selectedStatuses).toEqual([]);
    expect(mockOnRemoveFilter).toHaveBeenCalledWith("status-Done");
  });

  it("should handle removing date filter", () => {
    const activeFilters: ActiveFilter[] = [
      {
        id: "date-2024-01-01-2024-01-31",
        label: "Jan 1, 2024 – Jan 31, 2024",
        type: "date",
      },
    ];

    const { result } = renderHook(() =>
      useFilterState({
        activeFilters,
        onApplyFilters: mockOnApplyFilters,
        onApplyDateFilter: mockOnApplyDateFilter,
        onRemoveFilter: mockOnRemoveFilter,
      }),
    );

    act(() => {
      result.current.setDateRange({ start: "2024-01-01", end: "2024-01-31" });
    });

    expect(result.current.dateRange).toEqual({
      start: "2024-01-01",
      end: "2024-01-31",
    });

    act(() => {
      result.current.handleRemoveFilter("date-2024-01-01-2024-01-31");
    });

    expect(result.current.dateRange).toEqual({ start: "", end: "" });
    expect(mockOnRemoveFilter).toHaveBeenCalledWith(
      "date-2024-01-01-2024-01-31",
    );
  });

  it("should clear all filters", () => {
    const { result } = renderHook(() =>
      useFilterState({
        activeFilters: [],
        onApplyFilters: mockOnApplyFilters,
        onApplyDateFilter: mockOnApplyDateFilter,
        onRemoveFilter: mockOnRemoveFilter,
      }),
    );

    act(() => {
      result.current.toggleUploader("user1");
      result.current.toggleStatus("Done");
      result.current.setDateRange({ start: "2024-01-01", end: "2024-01-31" });
    });

    act(() => {
      result.current.clearAllFilters();
    });

    expect(result.current.selectedUploaders).toEqual([]);
    expect(result.current.selectedStatuses).toEqual([]);
    expect(result.current.dateRange).toEqual({ start: "", end: "" });
  });
});
