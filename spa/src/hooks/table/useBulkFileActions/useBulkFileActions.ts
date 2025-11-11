import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { File } from "@/types";

export interface UseBulkFileActionsProps {
  selectedFiles: Set<string>;
  files: File[];
  downloadFiles: (
    files: Array<{ collection: string; objectName: string }>,
  ) => Promise<void>;
}

export function useBulkFileActions({
  selectedFiles,
  files,
  downloadFiles,
}: UseBulkFileActionsProps) {
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const handleBulkDownload = useCallback(() => {
    if (selectedFiles.size === 0) {
      toast.error("No files selected", {
        description: "Please select files to download",
      });
      return;
    }

    // Get selected file objects
    const selectedFileObjects = files.filter((file) =>
      selectedFiles.has(file.object_name),
    );

    // Convert to format expected by downloadFiles
    const filesToDownload = selectedFileObjects.map((file) => ({
      collection: file.collection,
      objectName: file.object_name,
    }));

    // Use the context's downloadFiles which handles toasts and errors
    downloadFiles(filesToDownload);
  }, [selectedFiles, files, downloadFiles]);

  const handleBulkChangeStatus = useCallback(() => {
    if (selectedFiles.size === 0) {
      toast.error("No files selected", {
        description: "Please select files to change status",
      });
      return;
    }

    toast.info("TODO: Bulk status change not yet implemented", {
      description: `Would change status for ${selectedFiles.size} file${selectedFiles.size > 1 ? "s" : ""}`,
    });
  }, [selectedFiles]);

  const handleViewModeChange = useCallback((mode: "list" | "grid") => {
    setViewMode(mode);
    toast.info("TODO: View mode toggle not yet implemented", {
      description: `Would switch to ${mode} view`,
    });
  }, []);

  return {
    viewMode,
    handleBulkDownload,
    handleBulkChangeStatus,
    handleViewModeChange,
  };
}
