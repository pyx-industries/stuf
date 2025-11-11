import type { ActiveFilter } from "@/components/table/table-filters/TableFilters";
import React from "react";

export interface UseFilterStateProps {
  activeFilters: ActiveFilter[];
  onRemoveFilter?: (filterId: string) => void;
  onApplyFilters?: (uploaders: string[], statuses: string[]) => void;
  onApplyDateFilter?: (startDate: string, endDate: string) => void;
}

export function useFilterState({
  activeFilters,
  onRemoveFilter,
  onApplyFilters,
  onApplyDateFilter,
}: UseFilterStateProps) {
  const [selectedUploaders, setSelectedUploaders] = React.useState<string[]>(
    [],
  );
  const [selectedStatuses, setSelectedStatuses] = React.useState<string[]>([]);
  const [dateRange, setDateRange] = React.useState<{
    start: string;
    end: string;
  }>({ start: "", end: "" });
  const [isFiltersOpen, setIsFiltersOpen] = React.useState(false);

  const toggleUploader = (uploader: string) => {
    setSelectedUploaders((prev) =>
      prev.includes(uploader)
        ? prev.filter((u) => u !== uploader)
        : [...prev, uploader],
    );
  };

  const toggleStatus = (status: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status],
    );
  };

  const handleApplyFilters = () => {
    onApplyFilters?.(selectedUploaders, selectedStatuses);
    if (dateRange.start && dateRange.end) {
      onApplyDateFilter?.(dateRange.start, dateRange.end);
    }
    setIsFiltersOpen(false);
  };

  const handleRemoveFilter = (filterId: string) => {
    // Find the filter to determine its type
    const filter = activeFilters.find((f) => f.id === filterId);

    if (filter) {
      if (filter.type === "uploader") {
        // Extract uploader name from ID (format: "uploader-{name}")
        const uploaderName = filterId.replace("uploader-", "");
        setSelectedUploaders((prev) => prev.filter((u) => u !== uploaderName));
      } else if (filter.type === "status") {
        // Extract status from ID (format: "status-{status}")
        const status = filterId.replace("status-", "");
        setSelectedStatuses((prev) => prev.filter((s) => s !== status));
      } else if (filter.type === "date") {
        // Clear date range
        setDateRange({ start: "", end: "" });
      }
    }

    // Remove the filter chip
    onRemoveFilter?.(filterId);
  };

  const clearAllFilters = () => {
    setSelectedUploaders([]);
    setSelectedStatuses([]);
    setDateRange({ start: "", end: "" });
  };

  return {
    selectedUploaders,
    selectedStatuses,
    dateRange,
    isFiltersOpen,
    setDateRange,
    setIsFiltersOpen,
    toggleUploader,
    toggleStatus,
    handleApplyFilters,
    handleRemoveFilter,
    clearAllFilters,
  };
}
