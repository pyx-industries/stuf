import type { ActiveFilter } from "@/components/table/table-filters/TableFilters";
import { formatDateShort } from "@/lib/utils";
import type { File } from "@/types";
import { useMemo, useState } from "react";

export interface UseCollectionFiltersProps {
  files: File[];
}

export interface FilterValues {
  uploaders?: string[];
  statuses?: string[];
  dateRange?: { start: string; end: string };
}

export function useCollectionFilters({ files }: UseCollectionFiltersProps) {
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: "",
    end: "",
  });

  // Extract unique uploaders from files
  const availableUploaders = useMemo(() => {
    const uploaders = new Set(files.map((file) => file.owner));
    return Array.from(uploaders).sort();
  }, [files]);

  // Handle filter application
  const handleApplyFilters = (uploaders: string[], statuses: string[]) => {
    const newFilters: ActiveFilter[] = [];

    // Add uploader filters
    uploaders.forEach((uploader) => {
      newFilters.push({
        id: `uploader-${uploader}`,
        label: `Uploader: ${uploader}`,
        type: "uploader",
      });
    });

    // Add status filters
    statuses.forEach((status) => {
      newFilters.push({
        id: `status-${status}`,
        label: `Status: ${status}`,
        type: "status",
      });
    });

    setActiveFilters((prev) => {
      // Remove existing uploader and status filters
      const filtered = prev.filter((f) => f.type === "date");
      return [...filtered, ...newFilters];
    });
  };

  // Handle date filter application
  const handleApplyDateFilter = (startDate: string, endDate: string) => {
    // Store the raw date values for filtering
    setDateRange({ start: startDate, end: endDate });

    const formattedStart = formatDateShort(startDate);
    const formattedEnd = formatDateShort(endDate);

    const dateFilter: ActiveFilter = {
      id: `date-${startDate}-${endDate}`,
      label: `${formattedStart} – ${formattedEnd}`,
      type: "date",
    };

    setActiveFilters((prev) => {
      // Remove existing date filter
      const filtered = prev.filter((f) => f.type !== "date");
      return [...filtered, dateFilter];
    });
  };

  // Handle removing individual filter
  const handleRemoveFilter = (filterId: string) => {
    const filter = activeFilters.find((f) => f.id === filterId);
    if (filter?.type === "date") {
      setDateRange({ start: "", end: "" });
    }
    setActiveFilters((prev) => prev.filter((f) => f.id !== filterId));
  };

  // Handle clearing all filters
  const handleClearAllFilters = () => {
    setActiveFilters([]);
    setDateRange({ start: "", end: "" });
  };

  // Extract filter values from activeFilters for API call
  const currentFilters = useMemo<FilterValues>(() => {
    const uploaders = activeFilters
      .filter((f) => f.type === "uploader")
      .map((f) => f.id.replace("uploader-", ""));

    const statuses = activeFilters
      .filter((f) => f.type === "status")
      .map((f) => f.id.replace("status-", ""));

    return {
      uploaders: uploaders.length > 0 ? uploaders : undefined,
      statuses: statuses.length > 0 ? statuses : undefined,
      dateRange: dateRange.start && dateRange.end ? dateRange : undefined,
    };
  }, [activeFilters, dateRange]);

  return {
    activeFilters,
    availableUploaders,
    currentFilters,
    handleApplyFilters,
    handleApplyDateFilter,
    handleRemoveFilter,
    handleClearAllFilters,
  };
}
