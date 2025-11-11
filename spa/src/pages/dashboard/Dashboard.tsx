import { CollectionsGrid } from "@/components/collection/collections-grid";
import { UploadButton } from "@/components/collection/upload-button";
import { ConfirmDialog } from "@/components/dialogs/ConfirmDialog";
import { RecentFilesTable } from "@/components/table/recent-files-table";
import { Skeleton } from "@/components/ui/skeleton";
import { useCollections } from "@/contexts/collections";
import { useFiles } from "@/contexts/files";
import { useFileActions } from "@/hooks/file";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function Dashboard() {
  const navigate = useNavigate();
  const {
    collections,
    fetchCollections,
    loading: collectionsLoading,
  } = useCollections();
  const { files, fetchRecentFiles, loading } = useFiles();

  // Get file action handlers with refetch callback
  const refetchRecentFiles = () => {
    fetchRecentFiles();
    fetchCollections(); // Also refresh collections to update counts
  };

  const {
    handleDownload,
    handleViewHistory,
    handleDelete,
    handleArchive,
    deleteDialog,
    archiveDialog,
  } = useFileActions(refetchRecentFiles);

  useEffect(() => {
    fetchCollections();
    fetchRecentFiles();
  }, [fetchCollections, fetchRecentFiles]);

  const handleCollectionClick = (collectionId: string) => {
    navigate(`/collections/${collectionId}`);
  };

  const handleCollectionSettings = (collectionId: string) => {
    navigate(`/collections/${collectionId}/config`);
  };

  const handleCreateCollection = () => {
    // TODO: Implement create collection functionality
    toast.info("TODO: Create collection functionality not yet implemented");
  };

  const handleUploadFiles = () => {
    navigate(`/upload`);
  };

  return (
    <div className="flex flex-col gap-14">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1
          className="text-3xl font-extrabold leading-10 text-foreground"
          data-testid="dashboard-heading"
        >
          Files
        </h1>
        {collectionsLoading ? (
          <Skeleton
            className="h-10 w-32"
            data-testid="upload-button-skeleton"
          />
        ) : (
          <UploadButton onClick={handleUploadFiles} />
        )}
      </div>

      {/* Collections Grid */}
      <CollectionsGrid
        collections={collections}
        loading={collectionsLoading}
        onCollectionClick={handleCollectionClick}
        onCollectionSettings={handleCollectionSettings}
        onCreateCollection={handleCreateCollection}
      />

      {/* Recent Files Table */}
      <RecentFilesTable
        files={files}
        loading={loading}
        onDownload={handleDownload}
        onDelete={handleDelete}
        onViewHistory={handleViewHistory}
        onArchive={handleArchive}
      />

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        open={deleteDialog.open}
        title="Delete file"
        description="Are you sure you want to delete this file? This action can't be undone."
        confirmText="Delete"
        loadingText="Deleting..."
        isLoading={deleteDialog.isLoading}
        onConfirm={deleteDialog.onConfirm}
        onCancel={deleteDialog.onCancel}
      />

      <ConfirmDialog
        open={archiveDialog.open}
        title="Archive file"
        description="Are you sure you want to archive this file?"
        confirmText="Archive"
        loadingText="Archiving..."
        isLoading={archiveDialog.isLoading}
        onConfirm={archiveDialog.onConfirm}
        onCancel={archiveDialog.onCancel}
      />
    </div>
  );
}
