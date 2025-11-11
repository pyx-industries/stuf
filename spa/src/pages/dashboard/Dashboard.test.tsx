import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Dashboard } from "./Dashboard";

// Mock dependencies
const mockNavigate = vi.fn();
const mockFetchCollections = vi.fn();
const mockFetchRecentFiles = vi.fn();
const mockHandleDownload = vi.fn();
const mockHandleViewHistory = vi.fn();
const mockHandleDelete = vi.fn();
const mockHandleArchive = vi.fn();
const mockDeleteDialogOnConfirm = vi.fn();
const mockDeleteDialogOnCancel = vi.fn();
const mockArchiveDialogOnConfirm = vi.fn();
const mockArchiveDialogOnCancel = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("@/contexts/collections", () => ({
  useCollections: vi.fn(),
}));

vi.mock("@/contexts/files", () => ({
  useFiles: vi.fn(),
}));

vi.mock("@/hooks/file", () => ({
  useFileActions: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    info: vi.fn(),
  },
}));

vi.mock("react-oidc-context", () => ({
  useAuth: () => ({
    user: {
      profile: {
        preferred_username: "testuser",
        given_name: "Test",
        family_name: "User",
        email: "test@example.com",
        collections: {
          test: ["read", "write", "delete"],
        },
      },
    },
    isAuthenticated: true,
    isLoading: false,
  }),
}));

// Import mocked modules to access their mock implementations
import { useCollections } from "@/contexts/collections";
import { useFiles } from "@/contexts/files";
import { useFileActions } from "@/hooks/file";

const mockCollections = [
  { id: "collection-1", name: "Collection 1", fileCount: 10 },
  { id: "collection-2", name: "Collection 2", fileCount: 5 },
];

const mockFiles = [
  {
    object_name: "test/user/file1.pdf",
    original_filename: "file1.pdf",
    content_type: "application/pdf",
    size: 1024,
    upload_time: "2024-01-01T00:00:00Z",
    owner: "user@example.com",
    collection: "test",
  },
  {
    object_name: "test/user/file2.pdf",
    original_filename: "file2.pdf",
    content_type: "application/pdf",
    size: 2048,
    upload_time: "2024-01-02T00:00:00Z",
    owner: "user@example.com",
    collection: "test",
  },
];

describe("Dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    vi.mocked(useCollections).mockReturnValue({
      collections: mockCollections,
      fetchCollections: mockFetchCollections,
      loading: false,
      error: null,
    });

    vi.mocked(useFiles).mockReturnValue({
      files: mockFiles,
      fetchRecentFiles: mockFetchRecentFiles,
      loading: false,
      error: null,
      fetchFiles: vi.fn(),
      uploadFile: vi.fn(),
      downloadFile: vi.fn(),
      downloadFiles: vi.fn(),
      deleteFile: vi.fn(),
      archiveFile: vi.fn(),
      totalPages: 1,
      currentPage: 1,
      totalCount: 2,
    });

    vi.mocked(useFileActions).mockReturnValue({
      handleDownload: mockHandleDownload,
      handleViewHistory: mockHandleViewHistory,
      handleDelete: mockHandleDelete,
      handleArchive: mockHandleArchive,
      deleteDialog: {
        open: false,
        file: null,
        isLoading: false,
        onConfirm: mockDeleteDialogOnConfirm,
        onCancel: mockDeleteDialogOnCancel,
      },
      archiveDialog: {
        open: false,
        file: null,
        isLoading: false,
        onConfirm: mockArchiveDialogOnConfirm,
        onCancel: mockArchiveDialogOnCancel,
      },
    });
  });

  describe("Rendering", () => {
    it("renders the dashboard with title", () => {
      render(<Dashboard />);
      expect(screen.getByTestId("dashboard-heading")).toHaveTextContent(
        "Files",
      );
    });

    it("renders collections grid", () => {
      render(<Dashboard />);
      expect(screen.getByTestId("collections-grid")).toBeInTheDocument();
      expect(
        screen.getByTestId("collection-card-collection-1"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("collection-card-collection-2"),
      ).toBeInTheDocument();
    });

    it("renders recent files table", () => {
      render(<Dashboard />);
      expect(screen.getByText("file1.pdf")).toBeInTheDocument();
      expect(screen.getByText("file2.pdf")).toBeInTheDocument();
    });

    it("renders upload button when not loading", () => {
      render(<Dashboard />);
      expect(screen.getByTestId("upload-button")).toBeInTheDocument();
    });

    it("renders skeleton when collections are loading", () => {
      vi.mocked(useCollections).mockReturnValue({
        collections: [],
        fetchCollections: mockFetchCollections,
        loading: true,
        error: null,
      });

      render(<Dashboard />);
      expect(screen.getByTestId("upload-button-skeleton")).toBeInTheDocument();
      expect(
        screen.getByTestId("collections-grid-loading"),
      ).toBeInTheDocument();
      expect(screen.getByTestId("collection-skeleton-1")).toBeInTheDocument();
    });
  });

  describe("Data Fetching", () => {
    it("fetches collections and recent files on mount", () => {
      render(<Dashboard />);
      expect(mockFetchCollections).toHaveBeenCalled();
      expect(mockFetchRecentFiles).toHaveBeenCalled();
    });
  });

  describe("Navigation", () => {
    it("navigates to collection details when collection is clicked", async () => {
      const user = userEvent.setup();
      render(<Dashboard />);

      const viewButton = screen.getByTestId("view-button-collection-1");
      await user.click(viewButton);

      expect(mockNavigate).toHaveBeenCalledWith("/collections/collection-1");
    });

    it("navigates to upload page when upload button is clicked", async () => {
      const user = userEvent.setup();
      render(<Dashboard />);

      const uploadButton = screen.getByTestId("upload-button");
      await user.click(uploadButton);

      expect(mockNavigate).toHaveBeenCalledWith("/upload");
    });
  });

  describe("File Actions", () => {
    it("passes file action handlers to RecentFilesTable", () => {
      render(<Dashboard />);

      // Verify the handlers are available by checking they were passed to useFileActions
      expect(useFileActions).toHaveBeenCalled();
    });
  });

  describe("Delete Dialog", () => {
    it("does not render delete dialog when closed", () => {
      render(<Dashboard />);
      expect(screen.queryByTestId("confirm-dialog")).not.toBeInTheDocument();
    });

    it("renders delete dialog when open", () => {
      vi.mocked(useFileActions).mockReturnValue({
        handleDownload: mockHandleDownload,
        handleViewHistory: mockHandleViewHistory,
        handleDelete: mockHandleDelete,
        handleArchive: mockHandleArchive,
        deleteDialog: {
          open: true,
          file: mockFiles[0],
          isLoading: false,
          onConfirm: mockDeleteDialogOnConfirm,
          onCancel: mockDeleteDialogOnCancel,
        },
        archiveDialog: {
          open: false,
          file: null,
          isLoading: false,
          onConfirm: mockArchiveDialogOnConfirm,
          onCancel: mockArchiveDialogOnCancel,
        },
      });

      render(<Dashboard />);
      expect(screen.getByTestId("confirm-dialog-title")).toHaveTextContent(
        "Delete file",
      );
      expect(
        screen.getByTestId("confirm-dialog-description"),
      ).toHaveTextContent(
        "Are you sure you want to delete this file? This action can't be undone.",
      );
    });

    it("shows loading state in delete dialog", () => {
      vi.mocked(useFileActions).mockReturnValue({
        handleDownload: mockHandleDownload,
        handleViewHistory: mockHandleViewHistory,
        handleDelete: mockHandleDelete,
        handleArchive: mockHandleArchive,
        deleteDialog: {
          open: true,
          file: mockFiles[0],
          isLoading: true,
          onConfirm: mockDeleteDialogOnConfirm,
          onCancel: mockDeleteDialogOnCancel,
        },
        archiveDialog: {
          open: false,
          file: null,
          isLoading: false,
          onConfirm: mockArchiveDialogOnConfirm,
          onCancel: mockArchiveDialogOnCancel,
        },
      });

      render(<Dashboard />);
      const confirmButton = screen.getByTestId("confirm-dialog-confirm");
      expect(confirmButton).toHaveTextContent("Deleting...");
    });

    it("calls onConfirm when delete is confirmed", async () => {
      const user = userEvent.setup();

      vi.mocked(useFileActions).mockReturnValue({
        handleDownload: mockHandleDownload,
        handleViewHistory: mockHandleViewHistory,
        handleDelete: mockHandleDelete,
        handleArchive: mockHandleArchive,
        deleteDialog: {
          open: true,
          file: mockFiles[0],
          isLoading: false,
          onConfirm: mockDeleteDialogOnConfirm,
          onCancel: mockDeleteDialogOnCancel,
        },
        archiveDialog: {
          open: false,
          file: null,
          isLoading: false,
          onConfirm: mockArchiveDialogOnConfirm,
          onCancel: mockArchiveDialogOnCancel,
        },
      });

      render(<Dashboard />);

      const confirmButton = screen.getByTestId("confirm-dialog-confirm");
      await user.click(confirmButton);

      expect(mockDeleteDialogOnConfirm).toHaveBeenCalled();
    });

    it("calls onCancel when delete is cancelled", async () => {
      const user = userEvent.setup();

      vi.mocked(useFileActions).mockReturnValue({
        handleDownload: mockHandleDownload,
        handleViewHistory: mockHandleViewHistory,
        handleDelete: mockHandleDelete,
        handleArchive: mockHandleArchive,
        deleteDialog: {
          open: true,
          file: mockFiles[0],
          isLoading: false,
          onConfirm: mockDeleteDialogOnConfirm,
          onCancel: mockDeleteDialogOnCancel,
        },
        archiveDialog: {
          open: false,
          file: null,
          isLoading: false,
          onConfirm: mockArchiveDialogOnConfirm,
          onCancel: mockArchiveDialogOnCancel,
        },
      });

      render(<Dashboard />);

      const cancelButton = screen.getByTestId("confirm-dialog-cancel");
      await user.click(cancelButton);

      expect(mockDeleteDialogOnCancel).toHaveBeenCalled();
    });
  });

  describe("Archive Dialog", () => {
    it("does not render archive dialog when closed", () => {
      render(<Dashboard />);
      // Only one dialog is rendered, and it's closed
      expect(screen.queryByTestId("confirm-dialog")).not.toBeInTheDocument();
    });

    it("renders archive dialog when open", () => {
      vi.mocked(useFileActions).mockReturnValue({
        handleDownload: mockHandleDownload,
        handleViewHistory: mockHandleViewHistory,
        handleDelete: mockHandleDelete,
        handleArchive: mockHandleArchive,
        deleteDialog: {
          open: false,
          file: null,
          isLoading: false,
          onConfirm: mockDeleteDialogOnConfirm,
          onCancel: mockDeleteDialogOnCancel,
        },
        archiveDialog: {
          open: true,
          file: mockFiles[0],
          isLoading: false,
          onConfirm: mockArchiveDialogOnConfirm,
          onCancel: mockArchiveDialogOnCancel,
        },
      });

      render(<Dashboard />);
      expect(screen.getByTestId("confirm-dialog-title")).toHaveTextContent(
        "Archive file",
      );
      expect(
        screen.getByTestId("confirm-dialog-description"),
      ).toHaveTextContent("Are you sure you want to archive this file?");
    });

    it("shows loading state in archive dialog", () => {
      vi.mocked(useFileActions).mockReturnValue({
        handleDownload: mockHandleDownload,
        handleViewHistory: mockHandleViewHistory,
        handleDelete: mockHandleDelete,
        handleArchive: mockHandleArchive,
        deleteDialog: {
          open: false,
          file: null,
          isLoading: false,
          onConfirm: mockDeleteDialogOnConfirm,
          onCancel: mockDeleteDialogOnCancel,
        },
        archiveDialog: {
          open: true,
          file: mockFiles[0],
          isLoading: true,
          onConfirm: mockArchiveDialogOnConfirm,
          onCancel: mockArchiveDialogOnCancel,
        },
      });

      render(<Dashboard />);
      const confirmButton = screen.getByTestId("confirm-dialog-confirm");
      expect(confirmButton).toHaveTextContent("Archiving...");
    });

    it("calls onConfirm when archive is confirmed", async () => {
      const user = userEvent.setup();

      vi.mocked(useFileActions).mockReturnValue({
        handleDownload: mockHandleDownload,
        handleViewHistory: mockHandleViewHistory,
        handleDelete: mockHandleDelete,
        handleArchive: mockHandleArchive,
        deleteDialog: {
          open: false,
          file: null,
          isLoading: false,
          onConfirm: mockDeleteDialogOnConfirm,
          onCancel: mockDeleteDialogOnCancel,
        },
        archiveDialog: {
          open: true,
          file: mockFiles[0],
          isLoading: false,
          onConfirm: mockArchiveDialogOnConfirm,
          onCancel: mockArchiveDialogOnCancel,
        },
      });

      render(<Dashboard />);

      const confirmButton = screen.getByTestId("confirm-dialog-confirm");
      await user.click(confirmButton);

      expect(mockArchiveDialogOnConfirm).toHaveBeenCalled();
    });

    it("calls onCancel when archive is cancelled", async () => {
      const user = userEvent.setup();

      vi.mocked(useFileActions).mockReturnValue({
        handleDownload: mockHandleDownload,
        handleViewHistory: mockHandleViewHistory,
        handleDelete: mockHandleDelete,
        handleArchive: mockHandleArchive,
        deleteDialog: {
          open: false,
          file: null,
          isLoading: false,
          onConfirm: mockDeleteDialogOnConfirm,
          onCancel: mockDeleteDialogOnCancel,
        },
        archiveDialog: {
          open: true,
          file: mockFiles[0],
          isLoading: false,
          onConfirm: mockArchiveDialogOnConfirm,
          onCancel: mockArchiveDialogOnCancel,
        },
      });

      render(<Dashboard />);

      const cancelButton = screen.getByTestId("confirm-dialog-cancel");
      await user.click(cancelButton);

      expect(mockArchiveDialogOnCancel).toHaveBeenCalled();
    });
  });

  describe("Empty States", () => {
    it("renders with no collections", () => {
      vi.mocked(useCollections).mockReturnValue({
        collections: [],
        fetchCollections: mockFetchCollections,
        loading: false,
        error: null,
      });

      render(<Dashboard />);
      expect(screen.getByText("Files")).toBeInTheDocument();
    });

    it("renders with no files", () => {
      vi.mocked(useFiles).mockReturnValue({
        files: [],
        fetchRecentFiles: mockFetchRecentFiles,
        loading: false,
        error: null,
        fetchFiles: vi.fn(),
        uploadFile: vi.fn(),
        downloadFile: vi.fn(),
        downloadFiles: vi.fn(),
        deleteFile: vi.fn(),
        archiveFile: vi.fn(),
        totalPages: 0,
        currentPage: 1,
        totalCount: 0,
      });

      render(<Dashboard />);
      expect(screen.getByText("Files")).toBeInTheDocument();
    });
  });
});
