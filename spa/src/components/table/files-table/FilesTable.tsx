import { FileActions } from "@/components/table/file-actions";
import { PaginatedTable } from "@/components/table/paginated-table";
import { Checkbox } from "@/components/ui/checkbox";
import { useTableSelection } from "@/hooks/table";
import { formatDateTime, formatFileSize } from "@/lib/utils";
import type { File } from "@/types";
import { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";

export interface FilesTableProps {
  files: File[];
  isLoading?: boolean;
  currentPage: number;
  totalPages: number;
  totalResults: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onDownload: (file: File) => void;
  onDelete: (file: File) => void;
  onViewHistory: (file: File) => void;
  onArchive: (file: File) => void;
  showCheckboxes?: boolean;
  selectedFiles?: Set<string>;
  onSelectionChange?: (selected: Set<string>) => void;
}

export function FilesTable({
  files,
  isLoading = false,
  currentPage,
  totalPages,
  totalResults,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onDownload,
  onDelete,
  onViewHistory,
  onArchive,
  showCheckboxes = true,
  selectedFiles: externalSelectedFiles,
  onSelectionChange,
}: FilesTableProps) {
  const {
    selectedItems: selectedFiles,
    toggleItem: toggleFileSelection,
    toggleAll,
    areAllSelected,
    areSomeSelected,
  } = useTableSelection({
    selectedItems: externalSelectedFiles,
    onSelectionChange,
  });

  const allFileIds = useMemo(() => files.map((f) => f.object_name), [files]);

  const toggleSelectAll = () => toggleAll(allFileIds);
  const isAllSelected = areAllSelected(allFileIds);
  const isIndeterminate = areSomeSelected(allFileIds);

  const columns: ColumnDef<File>[] = useMemo(
    () => [
      ...(showCheckboxes
        ? [
            {
              id: "select",
              header: () => (
                <Checkbox
                  checked={isAllSelected}
                  indeterminate={isIndeterminate}
                  onCheckedChange={toggleSelectAll}
                />
              ),
              cell: ({ row }: any) => (
                <Checkbox
                  checked={selectedFiles.has(row.original.object_name)}
                  onCheckedChange={() =>
                    toggleFileSelection(row.original.object_name)
                  }
                />
              ),
            },
          ]
        : []),
      {
        accessorKey: "original_filename",
        header: "Name",
        cell: ({ row }: any) => (
          <div className="flex-1 text-foreground">
            {row.original.original_filename}
          </div>
        ),
      },
      {
        accessorKey: "upload_time",
        header: "Upload date and time",
        cell: ({ row }: any) => (
          <div className="text-foreground">
            {formatDateTime(row.original.upload_time)}
          </div>
        ),
      },
      {
        accessorKey: "owner",
        header: "Uploader",
        cell: ({ row }: any) => (
          <div className="text-foreground">{row.original.owner}</div>
        ),
      },
      {
        accessorKey: "size",
        header: "Size (mb)",
        cell: ({ row }: any) => (
          <div className="text-foreground">
            {formatFileSize(row.original.size)}
          </div>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }: any) => (
          <div className="text-foreground">
            {row.original.metadata?.status || "In progress"}
          </div>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }: any) => (
          <FileActions
            file={row.original}
            onDownload={onDownload}
            onDelete={onDelete}
            onViewHistory={onViewHistory}
            onArchive={onArchive}
          />
        ),
      },
    ],
    [
      showCheckboxes,
      isAllSelected,
      isIndeterminate,
      toggleSelectAll,
      selectedFiles,
      toggleFileSelection,
      formatDateTime,
      formatFileSize,
      onDownload,
      onDelete,
      onViewHistory,
      onArchive,
    ],
  );

  return (
    <PaginatedTable
      columns={columns}
      data={files}
      isLoading={isLoading}
      currentPage={currentPage}
      totalPages={totalPages}
      totalResults={totalResults}
      pageSize={pageSize}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
    />
  );
}
