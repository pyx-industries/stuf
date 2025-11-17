import { BulkActions } from "@/components/table/bulk-actions";
import { FilterChips } from "@/components/table/filter-chips";
import { FilterDropdown } from "@/components/table/filter-dropdown";
import { TableSort, type SortOption } from "@/components/table/table-sort";
import { ViewToggle } from "@/components/table/view-toggle";
import { useFilterState } from "@/hooks/table";

export interface ActiveFilter {
  id: string;
  label: string;
  type?: "uploader" | "status" | "date";
}

export interface TableFiltersProps {
  selectedCount?: number;
  onDownload?: () => void;
  onChangeStatus?: (status: string) => void;
  sortValue?: string;
  onSortChange?: (value: string) => void;
  sortOptions?: SortOption[];
  viewMode?: "list" | "grid";
  onViewModeChange?: (mode: "list" | "grid") => void;
  showViewToggle?: boolean;
  activeFilters?: ActiveFilter[];
  onRemoveFilter?: (filterId: string) => void;
  onClearAllFilters?: () => void;
  availableUploaders?: string[];
  onApplyFilters?: (uploaders: string[], statuses: string[]) => void;
  onApplyDateFilter?: (startDate: string, endDate: string) => void;
  testId?: string;
}

export function TableFilters({
  selectedCount = 0,
  onDownload,
  onChangeStatus,
  sortValue,
  onSortChange,
  sortOptions = [],
  viewMode = "list",
  onViewModeChange,
  showViewToggle = true,
  activeFilters = [],
  onRemoveFilter,
  onClearAllFilters,
  availableUploaders = [],
  onApplyFilters,
  onApplyDateFilter,
  testId = "table-filters",
}: TableFiltersProps) {
  const hasActiveFilters = activeFilters.length > 0;

  const {
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
  } = useFilterState({
    activeFilters,
    onRemoveFilter,
    onApplyFilters,
    onApplyDateFilter,
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Main filters bar */}
      <div
        className="self-stretch flex flex-col md:flex-row gap-3 md:gap-0 md:justify-between md:items-start"
        data-testid={testId}
      >
        {/* Left side - Filters dropdown or active state */}
        {hasActiveFilters ? (
          <div className="inline-flex justify-start items-center gap-1">
            {/* Filters button (active state) */}
            <div className="px-3 py-2 bg-sidebar rounded-md flex justify-start items-center gap-2.5 outline outline-1 outline-offset-[-1px] outline-border">
              <div className="justify-start text-sidebar-foreground text-sm font-normal leading-normal">
                Filters
              </div>
            </div>

            {/* Clear all button */}
            {onClearAllFilters && (
              <button
                onClick={() => {
                  // Clear local state
                  clearAllFilters();
                  // Clear active filters
                  onClearAllFilters();
                }}
                className="px-2 py-1.5 flex justify-start items-center gap-1 cursor-pointer hover:bg-sidebar-accent rounded transition-colors"
              >
                <svg
                  className="w-2.5 h-2.5"
                  viewBox="0 0 10 10"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1 1L9 9M9 1L1 9"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    className="text-sidebar-foreground"
                  />
                </svg>
                <div className="justify-start text-sidebar-foreground text-sm font-medium leading-normal">
                  Clear all
                </div>
              </button>
            )}
          </div>
        ) : (
          <FilterDropdown
            isOpen={isFiltersOpen}
            onOpenChange={setIsFiltersOpen}
            availableUploaders={availableUploaders}
            selectedUploaders={selectedUploaders}
            onToggleUploader={toggleUploader}
            selectedStatuses={selectedStatuses}
            onToggleStatus={toggleStatus}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            onApply={handleApplyFilters}
            testId={`${testId}-filters`}
          />
        )}

        {/* Right side controls */}
        <div className="flex flex-wrap justify-start items-center gap-3">
          {/* Bulk actions */}
          <BulkActions
            selectedCount={selectedCount}
            onDownload={onDownload}
            onChangeStatus={onChangeStatus}
            testId={testId}
          />

          {/* Sort control using TableSort */}
          {onSortChange && sortOptions.length > 0 && (
            <TableSort
              value={sortValue}
              onValueChange={onSortChange}
              options={sortOptions}
              placeholder="Sort by"
              className="w-full sm:w-48"
              testId={`${testId}-sort`}
            />
          )}

          {/* View toggle */}
          {showViewToggle && (
            <ViewToggle
              viewMode={viewMode}
              onViewModeChange={onViewModeChange}
              testId={`${testId}-view-toggle`}
            />
          )}
        </div>
      </div>

      {/* Filter chips - below all buttons */}
      {hasActiveFilters && (
        <FilterChips
          filters={activeFilters}
          onRemoveFilter={handleRemoveFilter}
          testId={`${testId}-chips`}
        />
      )}
    </div>
  );
}
