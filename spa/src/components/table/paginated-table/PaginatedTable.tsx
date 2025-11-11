import { DataTable } from "@/components/table/data-table";
import { TablePagination } from "@/components/table/table-pagination";
import { ColumnDef } from "@tanstack/react-table";

export interface PaginatedTableProps<TData, TValue = unknown> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  emptyMessage?: string;
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

export function PaginatedTable<TData, TValue = unknown>({
  columns,
  data,
  isLoading = false,
  emptyMessage = "No results.",
  currentPage,
  totalPages,
  totalResults,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  className,
  testId = "paginated-table",
}: PaginatedTableProps<TData, TValue>) {
  return (
    <div className="flex flex-col gap-6">
      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        emptyMessage={emptyMessage}
        className={className}
        testId={testId}
      />

      {totalPages > 0 && (
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalResults={totalResults}
          pageSize={pageSize}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          pageSizeOptions={pageSizeOptions}
          testId={`${testId}-pagination`}
        />
      )}
    </div>
  );
}
