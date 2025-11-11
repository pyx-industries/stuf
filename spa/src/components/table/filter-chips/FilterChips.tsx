import type { ActiveFilter } from "@/components/table/table-filters/TableFilters";

export interface FilterChipsProps {
  filters: ActiveFilter[];
  onRemoveFilter?: (filterId: string) => void;
  testId?: string;
}

export function FilterChips({
  filters,
  onRemoveFilter,
  testId = "filter-chips",
}: FilterChipsProps) {
  if (filters.length === 0) {
    return null;
  }

  return (
    <div
      className="inline-flex justify-start items-center gap-2 flex-wrap"
      data-testid={testId}
    >
      {filters.map((filter) => (
        <div
          key={filter.id}
          className="px-3 py-1.5 bg-sidebar-accent rounded flex justify-start items-center gap-2.5"
          data-testid={`${testId}-chip-${filter.id}`}
        >
          {filter.type === "date" && (
            <svg
              className="w-3.5 h-4"
              viewBox="0 0 14 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12.4444 1.77778H11.5556V0H9.77778V1.77778H4.22222V0H2.44444V1.77778H1.55556C0.692222 1.77778 0 2.47 0 3.33333V14.4444C0 15.3078 0.692222 16 1.55556 16H12.4444C13.3078 16 14 15.3078 14 14.4444V3.33333C14 2.47 13.3078 1.77778 12.4444 1.77778ZM12.4444 14.4444H1.55556V5.77778H12.4444V14.4444Z"
                fill="currentColor"
                className="text-sidebar-foreground"
              />
            </svg>
          )}
          <div className="justify-start text-sidebar-foreground text-sm font-normal leading-normal">
            {filter.label}
          </div>
          {onRemoveFilter && (
            <button
              onClick={() => onRemoveFilter(filter.id)}
              className="w-5 h-5 flex items-center justify-center cursor-pointer hover:bg-sidebar rounded transition-colors"
              aria-label={`Remove filter: ${filter.label}`}
              data-testid={`${testId}-remove-${filter.id}`}
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
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
