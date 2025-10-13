import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  ColumnDef,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface DataTableProps<TData, TValue = unknown> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  className?: string;
  isLoading?: boolean;
  emptyMessage?: string;
  testId?: string;
}

export function DataTable<TData, TValue = unknown>({
  columns,
  data,
  className,
  isLoading = false,
  emptyMessage = "No results.",
  testId = "data-table",
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className={cn("w-full", className)} data-testid={testId}>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow
              key={headerGroup.id}
              className="border-b border-border hover:bg-transparent"
              data-testid={`${testId}-header-row`}
            >
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={cn(
                    "px-3.5 py-2 bg-muted border-t border-border text-base font-normal leading-normal text-foreground",
                  )}
                  data-testid={`${testId}-header-${header.id}`}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody
          className={cn(
            table.getRowModel().rows?.length && "[&_tr:last-child]:border-b",
          )}
          data-testid={`${testId}-body`}
        >
          {isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow
                key={index}
                className="border-b border-border hover:bg-transparent"
                data-testid={`${testId}-skeleton-row-${index}`}
              >
                {columns.map((_, colIndex) => (
                  <TableCell
                    key={colIndex}
                    className="px-3.5 py-4 text-base leading-7"
                  >
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                className="border-b border-border"
                data-testid={`${testId}-row-${row.id}`}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cn(
                      "px-3.5 py-4 border-t border-border text-base leading-7 text-foreground",
                    )}
                    data-testid={`${testId}-cell-${cell.id}`}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow
              className="hover:bg-transparent"
              data-testid={`${testId}-empty-row`}
            >
              <TableCell
                colSpan={columns.length}
                className="h-64 text-center align-middle text-muted-foreground"
                data-testid={`${testId}-empty-message`}
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
