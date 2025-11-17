import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface FilterDropdownProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  availableUploaders: string[];
  selectedUploaders: string[];
  onToggleUploader: (uploader: string) => void;
  selectedStatuses: string[];
  onToggleStatus: (status: string) => void;
  dateRange: { start: string; end: string };
  onDateRangeChange: (dateRange: { start: string; end: string }) => void;
  onApply: () => void;
  testId?: string;
}

export function FilterDropdown({
  isOpen,
  onOpenChange,
  availableUploaders,
  selectedUploaders,
  onToggleUploader,
  selectedStatuses,
  onToggleStatus,
  dateRange,
  onDateRangeChange,
  onApply,
  testId = "filter-dropdown",
}: FilterDropdownProps) {
  const statuses = ["In progress", "Review", "Done"];

  return (
    <DropdownMenu open={isOpen} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          className="px-3 py-2 bg-sidebar rounded-md outline outline-1 outline-offset-[-1px] outline-border inline-flex justify-between items-center gap-2 hover:bg-sidebar-accent transition-colors cursor-pointer"
          data-testid={`${testId}-trigger`}
        >
          <div className="justify-start text-sidebar-foreground text-sm font-normal leading-normal">
            Filters
          </div>
          <div className="w-5 h-5 relative flex items-center justify-center">
            <div className="w-2.5 h-2.5 relative">
              <svg
                className="w-full h-full"
                viewBox="0 0 10 10"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5 0V10M0 5H10"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-sidebar-foreground"
                />
              </svg>
            </div>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-80 p-4 bg-sidebar border-border"
        data-testid={`${testId}-content`}
      >
        {/* Uploader section - only show if there are uploaders */}
        {availableUploaders.length > 0 && (
          <div className="mb-4">
            <div className="text-sm font-medium mb-2 text-sidebar-foreground">
              Uploader
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {availableUploaders.map((uploader) => (
                <label
                  key={uploader}
                  className="flex items-center gap-2 cursor-pointer hover:bg-sidebar-accent p-1 rounded"
                >
                  <Checkbox
                    checked={selectedUploaders.includes(uploader)}
                    onCheckedChange={() => onToggleUploader(uploader)}
                  />
                  <span className="text-sm text-sidebar-foreground">
                    {uploader}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Status section */}
        <div className="mb-4">
          <div className="text-sm font-medium mb-2 text-sidebar-foreground">
            Status
          </div>
          <div className="space-y-2">
            {statuses.map((status) => (
              <label
                key={status}
                className="flex items-center gap-2 cursor-pointer hover:bg-sidebar-accent p-1 rounded"
              >
                <Checkbox
                  checked={selectedStatuses.includes(status)}
                  onCheckedChange={() => onToggleStatus(status)}
                />
                <span className="text-sm text-sidebar-foreground">
                  {status}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Date section */}
        <div className="mb-4">
          <div className="text-sm font-medium mb-2 text-sidebar-foreground">
            Date Range
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                From
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) =>
                  onDateRangeChange({
                    ...dateRange,
                    start: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-border rounded-md text-sm bg-sidebar text-sidebar-foreground [color-scheme:light] dark:[color-scheme:dark]"
                data-testid={`${testId}-date-start`}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                To
              </label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) =>
                  onDateRangeChange({
                    ...dateRange,
                    end: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-border rounded-md text-sm bg-sidebar text-sidebar-foreground [color-scheme:light] dark:[color-scheme:dark]"
                data-testid={`${testId}-date-end`}
              />
            </div>
          </div>
        </div>

        {/* Apply button */}
        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            data-testid={`${testId}-cancel`}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={onApply}
            disabled={
              selectedUploaders.length === 0 &&
              selectedStatuses.length === 0 &&
              (!dateRange.start || !dateRange.end)
            }
            data-testid={`${testId}-apply`}
          >
            Apply
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
