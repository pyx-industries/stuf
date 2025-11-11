import { DataTable } from "@/components/table/data-table";
import { FileActions } from "@/components/table/file-actions";
import { TableSort } from "@/components/table/table-sort";
import { sortOptions, useFilesSort } from "@/hooks/file/useFilesSort";
import type { File } from "@/types";
import type { FileSortField } from "@/types/services/files";
import { ColumnDef } from "@tanstack/react-table";

export interface RecentFilesTableProps {
  files: File[];
  loading?: boolean;
  onDownload: (file: File) => void;
  onDelete: (file: File) => void;
  onViewHistory?: (file: File) => void;
  onArchive?: (file: File) => void;
}

export function RecentFilesTable({
  files,
  loading = false,
  onDownload,
  onDelete,
  onViewHistory,
  onArchive,
}: RecentFilesTableProps) {
  const { sortedFiles, sortBy, setSortBy } = useFilesSort(files);

  const columns: ColumnDef<File>[] = [
    {
      accessorKey: "original_filename",
      header: "Name",
      cell: ({ row }) => (
        <div className="flex-1">{row.getValue("original_filename")}</div>
      ),
    },
    {
      accessorKey: "upload_time",
      header: "Upload date and time",
      cell: ({ row }) => {
        const date = new Date(row.getValue("upload_time"));
        return (
          <div>
            {date.toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}{" "}
            {date.toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })}
          </div>
        );
      },
    },
    {
      accessorKey: "owner",
      header: "Uploader",
    },
    {
      accessorKey: "size",
      header: "Size (mb)",
      cell: ({ row }) => {
        const size = row.getValue("size") as number | undefined;
        if (!size) return "-";
        return (size / (1024 * 1024)).toFixed(1);
      },
    },
    {
      accessorKey: "metadata",
      header: "Status",
      cell: ({ row }) => {
        const metadata = row.getValue("metadata") as Record<string, any>;
        return metadata?.status || "In progress";
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <FileActions
          file={row.original}
          onDownload={onDownload}
          onDelete={onDelete}
          onViewHistory={onViewHistory}
          onArchive={onArchive}
        />
      ),
    },
  ];

  const handleSortChange = (value: string) => {
    setSortBy(value as FileSortField);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-start">
        <h2 className="text-2xl font-semibold font-['Roboto'] leading-loose text-foreground">
          Recent files
        </h2>
        <TableSort
          value={sortBy}
          onValueChange={handleSortChange}
          options={sortOptions}
          testId="recent-files-table-sort"
          isLoading={loading}
        />
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          <DataTable
            columns={columns}
            data={sortedFiles}
            isLoading={loading}
            emptyMessage="No recent files"
            testId="recent-files-table"
          />
        </div>
      </div>
    </div>
  );
}
