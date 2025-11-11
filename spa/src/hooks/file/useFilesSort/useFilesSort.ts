import type { File } from "@/types";
import type { FileSortField, SortDirection } from "@/types/services/files";
import { useMemo, useState } from "react";

const DEFAULT_STATUS = "In progress";

export const sortOptions = [
  { value: "status", label: "Status" },
  { value: "uploader", label: "Uploader" },
  { value: "date", label: "Date" },
];

export interface UseFilesSortOptions {
  initialSortBy?: FileSortField;
  initialDirection?: SortDirection;
}

export function useFilesSort(files: File[], options: UseFilesSortOptions = {}) {
  const { initialSortBy = "status", initialDirection = "desc" } = options;

  const [sortBy, setSortBy] = useState<FileSortField>(initialSortBy);
  const [sortDirection, setSortDirection] =
    useState<SortDirection>(initialDirection);

  const sortedFiles = useMemo(() => {
    const sorted = [...files].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case "status":
          aValue = (a.metadata?.status ?? DEFAULT_STATUS).toLowerCase();
          bValue = (b.metadata?.status ?? DEFAULT_STATUS).toLowerCase();
          break;
        case "uploader":
          aValue = (a.owner ?? "").toLowerCase();
          bValue = (b.owner ?? "").toLowerCase();
          break;
        case "date": {
          const aDate = new Date(a.upload_time);
          const bDate = new Date(b.upload_time);

          // Handle invalid dates by treating them as earliest/latest
          aValue = isNaN(aDate.getTime()) ? 0 : aDate.getTime();
          bValue = isNaN(bDate.getTime()) ? 0 : bDate.getTime();
          break;
        }
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [files, sortBy, sortDirection]);

  const handleSortChange = (field: FileSortField) => {
    if (field === sortBy) {
      // Toggle direction if same field
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      // Reset to descending for new field
      setSortBy(field);
      setSortDirection("desc");
    }
  };

  return {
    sortedFiles,
    sortBy,
    sortDirection,
    setSortBy,
    setSortDirection,
    handleSortChange,
  };
}
