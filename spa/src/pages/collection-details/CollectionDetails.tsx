import { UploadButton } from "@/components/collection/upload-button";
import { ConfirmDialog } from "@/components/dialogs/ConfirmDialog";
import { FilesTable } from "@/components/table/files-table";
import { TableFilters } from "@/components/table/table-filters";
import { useFiles } from "@/contexts/files";
import { sortOptions, useFileActions } from "@/hooks/file";
import { useBulkFileActions, useCollectionFilters } from "@/hooks/table";
import { ChevronLeft } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";

export function CollectionDetails() {
  const { collectionId } = useParams<{ collectionId: string }>();
  const navigate = useNavigate();
  const {
    files,
    loading,
    fetchFiles,
    downloadFiles,
    totalPages,
    currentPage,
    totalCount,
  } = useFiles();
  const [pageSize, setPageSize] = useState(10);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<string>("status");

  // Use collection filters hook
  const {
    activeFilters,
    availableUploaders,
    currentFilters,
    handleApplyFilters,
    handleApplyDateFilter,
    handleRemoveFilter,
    handleClearAllFilters,
  } = useCollectionFilters({ files });

  // Use bulk file actions hook
  const {
    viewMode,
    handleBulkDownload,
    handleBulkChangeStatus,
    handleViewModeChange,
  } = useBulkFileActions({
    selectedFiles,
    files,
    downloadFiles,
  });

  // Create refetch function with current filters
  const refetchCurrentFiles = useCallback(() => {
    if (collectionId) {
      fetchFiles(collectionId, currentPage, pageSize, currentFilters);
    }
  }, [collectionId, currentPage, pageSize, currentFilters, fetchFiles]);

  // Get file action handlers
  const {
    handleDownload,
    handleViewHistory,
    handleDelete,
    handleArchive,
    deleteDialog,
    archiveDialog,
  } = useFileActions(refetchCurrentFiles);

  useEffect(() => {
    if (collectionId) {
      fetchFiles(collectionId, currentPage, pageSize, currentFilters);
    }
  }, [collectionId, currentPage, pageSize, currentFilters, fetchFiles]);

  const handlePageChange = (page: number) => {
    if (collectionId) {
      fetchFiles(collectionId, page, pageSize, currentFilters);
    }
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    if (collectionId) {
      fetchFiles(collectionId, 1, newPageSize, currentFilters);
    }
  };

  const handleAddFiles = () => {
    navigate(`/upload`);
  };

  if (!collectionId) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex flex-col gap-14">
      {/* Header */}
      <div className="flex flex-col gap-6">
        {/* Back button */}
        <Link
          to="/"
          className="self-stretch py-3 inline-flex justify-start items-center gap-2 cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5 text-neutral-700" />
          <span className="text-neutral-700 text-base font-normal font-['Roboto'] leading-snug">
            Back to Files home
          </span>
        </Link>

        {/* Title and Add files button */}
        <div className="inline-flex justify-between items-center">
          <h1 className="text-foreground text-3xl font-extrabold font-['Roboto'] leading-10">
            {collectionId}
          </h1>
          <UploadButton onClick={handleAddFiles} />
        </div>
      </div>

      {/* Files Table */}
      <div className="flex flex-col gap-6">
        {/* Filters */}
        <TableFilters
          selectedCount={selectedFiles.size}
          showViewToggle={true}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          onDownload={handleBulkDownload}
          onChangeStatus={handleBulkChangeStatus}
          sortValue={sortBy}
          onSortChange={setSortBy}
          sortOptions={sortOptions}
          activeFilters={activeFilters}
          onRemoveFilter={handleRemoveFilter}
          onClearAllFilters={handleClearAllFilters}
          availableUploaders={availableUploaders}
          onApplyFilters={handleApplyFilters}
          onApplyDateFilter={handleApplyDateFilter}
        />

        <FilesTable
          files={files}
          isLoading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
          totalResults={totalCount}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onDownload={handleDownload}
          onDelete={handleDelete}
          onViewHistory={handleViewHistory}
          onArchive={handleArchive}
          selectedFiles={selectedFiles}
          onSelectionChange={setSelectedFiles}
        />
      </div>

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
