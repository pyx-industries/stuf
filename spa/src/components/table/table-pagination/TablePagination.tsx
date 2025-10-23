import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalResults: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
  className?: string;
  testId?: string;
}

export function TablePagination({
  currentPage,
  totalPages,
  totalResults,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  className,
  testId = "table-pagination",
}: TablePaginationProps) {
  const startResult = (currentPage - 1) * pageSize + 1;
  const endResult = Math.min(currentPage * pageSize, totalResults);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];

    if (totalPages <= 6) {
      // Show all pages if 6 or less
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // More than 6 pages - always show exactly 6 elements
      // Determine if we're near the end (last 6 pages)
      if (currentPage > totalPages - 5) {
        // Near the end - show last 6 pages (no ellipsis)
        for (let i = totalPages - 5; i <= totalPages; i++) {
          pages.push(i);
        }
      } else if (currentPage <= 5) {
        // Near the start - show first 5 pages + ellipsis
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push("ellipsis");
      } else {
        // In the middle - show 5 pages starting from (currentPage - 1) + ellipsis
        const start = currentPage - 1;
        for (let i = start; i < start + 5; i++) {
          pages.push(i);
        }
        pages.push("ellipsis");
      }
    }

    return pages;
  };

  return (
    <div
      className={cn("flex items-center justify-between text-base", className)}
      data-testid={testId}
    >
      {/* Results info */}
      <div
        className="text-foreground text-base font-normal leading-snug flex-1"
        data-testid={`${testId}-results-info`}
      >
        {startResult}-{endResult} of {totalResults} results
      </div>

      {/* Pagination controls */}
      <div
        className="flex items-center gap-3"
        data-testid={`${testId}-controls`}
      >
        {/* Previous button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={cn(
            "inline-flex items-center justify-center",
            currentPage === 1
              ? "opacity-50 cursor-not-allowed"
              : "cursor-pointer",
          )}
          aria-label="Go to previous page"
          data-testid={`${testId}-previous`}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Page numbers */}
        {getPageNumbers().map((page, index) => (
          <div key={index}>
            {page === "ellipsis" ? (
              <div
                className="w-8 h-8 inline-flex items-center justify-center"
                data-testid={`${testId}-ellipsis-${index}`}
              >
                <MoreHorizontal className="w-6 h-6" />
              </div>
            ) : (
              <button
                onClick={() => onPageChange(page)}
                className={cn(
                  "w-8 h-8 px-1 rounded inline-flex flex-col justify-center items-center gap-2.5 overflow-hidden text-base font-normal leading-snug",
                  page === currentPage
                    ? "bg-foreground text-background"
                    : "text-foreground hover:bg-accent",
                )}
                data-testid={`${testId}-page-${page}`}
              >
                {page}
              </button>
            )}
          </div>
        ))}

        {/* Next button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={cn(
            "inline-flex items-center justify-center",
            currentPage === totalPages
              ? "opacity-50 cursor-not-allowed"
              : "cursor-pointer",
          )}
          aria-label="Go to next page"
          data-testid={`${testId}-next`}
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Per page selector */}
      <div
        className="flex items-center gap-2 flex-1 justify-end"
        data-testid={`${testId}-page-size`}
      >
        <span className="text-foreground text-base font-normal leading-snug">
          Per page
        </span>
        <Select
          value={pageSize.toString()}
          onValueChange={(value) => onPageSizeChange(Number(value))}
        >
          <SelectTrigger
            className="w-20 focus:ring-0 focus:ring-offset-0 border border-input shadow-none [&_svg]:opacity-100 [&_svg]:text-neutral-700 dark:[&_svg]:text-neutral-400 [&_svg]:stroke-[2.5]"
            data-testid={`${testId}-page-size-trigger`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent data-testid={`${testId}-page-size-content`}>
            {pageSizeOptions.map((size) => (
              <SelectItem
                key={size}
                value={size.toString()}
                data-testid={`${testId}-page-size-option-${size}`}
              >
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
