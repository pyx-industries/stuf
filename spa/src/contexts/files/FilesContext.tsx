import { ApplicationError } from "@/errors/api";
import { useUser } from "@/hooks/user";
import { downloadBlob } from "@/lib/utils";
import {
  filesReducer,
  initialFilesState,
  type FilesState,
} from "@/reducers/files";
import filesService from "@/services/files";
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
} from "react";
import { toast } from "sonner";

interface FilesContextType extends FilesState {
  fetchFiles: (
    collection: string,
    page?: number,
    pageSize?: number,
    filters?: {
      uploaders?: string[];
      statuses?: string[];
      dateRange?: { start: string; end: string };
    },
  ) => Promise<void>;
  fetchRecentFiles: (limit?: number) => Promise<void>;
  uploadFile: (
    file: File,
    collection: string,
    metadata?: Record<string, any>,
  ) => Promise<void>;
  deleteFile: (collection: string, objectName: string) => Promise<void>;
  archiveFile: (collection: string, objectName: string) => Promise<void>;
  downloadFile: (collection: string, objectName: string) => Promise<void>;
  downloadFiles: (
    files: Array<{ collection: string; objectName: string }>,
  ) => Promise<void>;
  totalPages: number;
  currentPage: number;
  totalCount: number;
}

const FilesContext = createContext<FilesContextType | undefined>(undefined);

export function FilesProvider({ children }: { children: React.ReactNode }) {
  const user = useUser();
  const [state, dispatch] = useReducer(filesReducer, initialFilesState);

  const fetchFiles = useCallback(
    async (
      collection: string,
      page: number = 1,
      pageSize: number = 10,
      filters?: {
        uploaders?: string[];
        statuses?: string[];
        dateRange?: { start: string; end: string };
      },
    ) => {
      try {
        dispatch({ type: "FETCH_START" });
        const result = await filesService.listFiles(
          collection,
          page,
          pageSize,
          filters,
        );

        dispatch({ type: "FETCH_SUCCESS", payload: result.files });
        dispatch({
          type: "SET_PAGINATION",
          payload: {
            totalPages: result.totalPages,
            currentPage: result.currentPage,
            totalCount: result.totalCount,
          },
        });
      } catch (error) {
        if (error instanceof ApplicationError) {
          dispatch({ type: "FETCH_ERROR", payload: error.message });
          toast.error(error.message, { description: error.action });
          return;
        }
        // Let error boundary handle unexpected errors
        throw error;
      }
    },
    [],
  );

  const fetchRecentFiles = useCallback(
    async (limit: number = 10) => {
      if (!user) {
        dispatch({ type: "RESET" });
        return;
      }

      try {
        dispatch({ type: "FETCH_START" });
        const result = await filesService.getRecentFiles(user, limit);

        // Show error toasts for any partial failures
        result.errors.forEach((error) => {
          toast.error(error.message, { description: error.action });
        });

        // Dispatch appropriate action based on whether there were errors
        if (result.errors.length > 0) {
          // If we have some successful files, it's a partial success
          if (result.files.length > 0) {
            dispatch({
              type: "FETCH_PARTIAL_SUCCESS",
              payload: {
                files: result.files,
                error: `Failed to fetch files from ${result.errors.length} collection${result.errors.length > 1 ? "s" : ""}`,
              },
            });
          } else {
            // All collections failed to fetch
            dispatch({
              type: "FETCH_ERROR",
              payload: "Failed to fetch recent files",
            });
          }
        } else {
          dispatch({ type: "FETCH_SUCCESS", payload: result.files });
        }
      } catch (error) {
        if (error instanceof ApplicationError) {
          dispatch({ type: "FETCH_ERROR", payload: error.message });
          toast.error(error.message, { description: error.action });
          return;
        }
        // Let error boundary handle unexpected errors
        throw error;
      }
    },
    [user?.collections],
  );

  const uploadFile = useCallback(
    async (
      file: File,
      collection: string,
      metadata: Record<string, any> = {},
    ) => {
      try {
        await filesService.uploadFile(file, collection, metadata);
        toast.success("File uploaded successfully");
      } catch (error) {
        if (error instanceof ApplicationError) {
          toast.error(error.message, { description: error.action });
        }
        throw error;
      }
    },
    [],
  );

  const deleteFile = useCallback(
    async (collection: string, objectName: string) => {
      try {
        await filesService.deleteFile(collection, objectName);
        toast.success("File deleted successfully");
      } catch (error) {
        if (error instanceof ApplicationError) {
          toast.error(error.message, { description: error.action });
        }
        throw error;
      }
    },
    [],
  );

  const archiveFile = useCallback(
    async (collection: string, objectName: string) => {
      // TODO: Implement archive functionality
      toast.info("TODO: Archive functionality not yet implemented", {
        description: `Would archive ${objectName} from ${collection}`,
      });
    },
    [],
  );

  const downloadFile = useCallback(
    async (collection: string, objectName: string) => {
      try {
        const response = await filesService.downloadFile(
          collection,
          objectName,
        );

        const blob = await response.blob();
        const filename = objectName.split("/").pop() || "download";
        downloadBlob(blob, filename);
      } catch (error) {
        if (error instanceof ApplicationError) {
          toast.error(error.message, { description: error.action });
        }
        throw error;
      }
    },
    [],
  );

  const downloadFiles = useCallback(
    async (files: Array<{ collection: string; objectName: string }>) => {
      if (files.length === 0) return;

      let successCount = 0;
      let errorCount = 0;

      // Download files sequentially
      for (const { collection, objectName } of files) {
        try {
          await downloadFile(collection, objectName);
          successCount++;
        } catch {
          errorCount++;
          // Error toast already shown by downloadFile
        }
      }

      // Show summary toast
      if (errorCount === 0) {
        toast.success(
          `Successfully downloaded ${successCount} file${successCount > 1 ? "s" : ""}`,
        );
      } else if (successCount === 0) {
        toast.error(
          `Failed to download all ${errorCount} file${errorCount > 1 ? "s" : ""}`,
        );
      } else {
        toast.warning(
          `Downloaded ${successCount} file${successCount > 1 ? "s" : ""}`,
          {
            description: `${errorCount} file${errorCount > 1 ? "s" : ""} failed to download`,
          },
        );
      }
    },
    [downloadFile],
  );

  const value = useMemo(
    () => ({
      ...state,
      fetchFiles,
      fetchRecentFiles,
      uploadFile,
      deleteFile,
      archiveFile,
      downloadFile,
      downloadFiles,
    }),
    [
      state,
      fetchFiles,
      fetchRecentFiles,
      uploadFile,
      deleteFile,
      archiveFile,
      downloadFile,
      downloadFiles,
    ],
  );

  return (
    <FilesContext.Provider value={value}>{children}</FilesContext.Provider>
  );
}

export function useFiles() {
  const context = useContext(FilesContext);
  if (context === undefined) {
    throw new Error("useFiles must be used within a FilesProvider");
  }
  return context;
}
