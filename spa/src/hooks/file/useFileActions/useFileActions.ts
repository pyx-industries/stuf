import { useFiles } from "@/contexts/files";
import type { File } from "@/types";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

export interface FileActionsDialogState {
  deleteDialog: {
    open: boolean;
    file: File | null;
    isLoading: boolean;
  };
  archiveDialog: {
    open: boolean;
    file: File | null;
    isLoading: boolean;
  };
}

export function useFileActions(refetchFiles: () => void) {
  const navigate = useNavigate();
  const { downloadFile, deleteFile, archiveFile } = useFiles();

  const [dialogState, setDialogState] = useState<FileActionsDialogState>({
    deleteDialog: { open: false, file: null, isLoading: false },
    archiveDialog: { open: false, file: null, isLoading: false },
  });

  // Download handler
  const handleDownload = useCallback(
    (file: File) => {
      downloadFile(file.collection, file.object_name);
    },
    [downloadFile],
  );

  // View history handler - navigates to file detail page
  const handleViewHistory = useCallback(
    (file: File) => {
      // Encode the object_name since it may contain slashes
      const encodedObjectName = encodeURIComponent(file.object_name);
      navigate(`/collections/${file.collection}/files/${encodedObjectName}`);
    },
    [navigate],
  );

  // Delete handlers
  const handleDeleteClick = useCallback((file: File) => {
    setDialogState((prev) => ({
      ...prev,
      deleteDialog: { open: true, file, isLoading: false },
    }));
  }, []);

  const handleDeleteConfirm = useCallback(
    async (file: File) => {
      // Set loading state
      setDialogState((prev) => ({
        ...prev,
        deleteDialog: { ...prev.deleteDialog, isLoading: true },
      }));

      try {
        await deleteFile(file.collection, file.object_name);
        setDialogState((prev) => ({
          ...prev,
          deleteDialog: { open: false, file: null, isLoading: false },
        }));
        refetchFiles();
      } catch {
        // Error is already handled by FilesContext with toast
        // Close dialog even on error
        setDialogState((prev) => ({
          ...prev,
          deleteDialog: { open: false, file: null, isLoading: false },
        }));
      }
    },
    [deleteFile, refetchFiles],
  );

  const handleDeleteCancel = useCallback(() => {
    setDialogState((prev) => ({
      ...prev,
      deleteDialog: { open: false, file: null, isLoading: false },
    }));
  }, []);

  // Archive handlers
  const handleArchiveClick = useCallback((file: File) => {
    setDialogState((prev) => ({
      ...prev,
      archiveDialog: { open: true, file, isLoading: false },
    }));
  }, []);

  const handleArchiveConfirm = useCallback(
    async (file: File) => {
      // Set loading state
      setDialogState((prev) => ({
        ...prev,
        archiveDialog: { ...prev.archiveDialog, isLoading: true },
      }));

      try {
        await archiveFile(file.collection, file.object_name);
        setDialogState((prev) => ({
          ...prev,
          archiveDialog: { open: false, file: null, isLoading: false },
        }));
        refetchFiles();
      } catch {
        // Error is already handled by FilesContext with toast
        // Close dialog even on error
        setDialogState((prev) => ({
          ...prev,
          archiveDialog: { open: false, file: null, isLoading: false },
        }));
      }
    },
    [archiveFile, refetchFiles],
  );

  const handleArchiveCancel = useCallback(() => {
    setDialogState((prev) => ({
      ...prev,
      archiveDialog: { open: false, file: null, isLoading: false },
    }));
  }, []);

  return {
    // Action handlers to pass to tables
    handleDownload,
    handleViewHistory,
    handleDelete: handleDeleteClick,
    handleArchive: handleArchiveClick,

    // Dialog state and handlers
    deleteDialog: {
      ...dialogState.deleteDialog,
      onConfirm: () => handleDeleteConfirm(dialogState.deleteDialog.file!),
      onCancel: handleDeleteCancel,
    },
    archiveDialog: {
      ...dialogState.archiveDialog,
      onConfirm: () => handleArchiveConfirm(dialogState.archiveDialog.file!),
      onCancel: handleArchiveCancel,
    },
  };
}
