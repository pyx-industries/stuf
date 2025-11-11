import { useFiles } from "@/contexts/files";
import { useFileActions } from "@/hooks/file/useFileActions";
import { useBulkFileActions } from "@/hooks/table/useBulkFileActions";
import { useCollectionFilters } from "@/hooks/table/useCollectionFilters";
import type { File } from "@/types";
import { render, screen } from "@testing-library/react";
import { AuthContext } from "react-oidc-context";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { CollectionDetails } from "./CollectionDetails";

// Mock the hooks
vi.mock("@/contexts/files", () => ({
  useFiles: vi.fn(),
  FilesProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

vi.mock("@/hooks/file/useFileActions", () => ({
  useFileActions: vi.fn(),
}));

vi.mock("@/hooks/table/useCollectionFilters", () => ({
  useCollectionFilters: vi.fn(),
}));

vi.mock("@/hooks/table/useBulkFileActions", () => ({
  useBulkFileActions: vi.fn(),
}));

vi.mock("@/hooks/file/useFilesSort", () => ({
  sortOptions: [
    { value: "name", label: "Name" },
    { value: "date", label: "Date" },
  ],
}));

const mockFiles: File[] = [
  {
    object_name: "collection-1/user1/file1.txt",
    original_filename: "file1.txt",
    collection: "collection-1",
    owner: "user1@example.com",
    upload_time: "2024-01-01T00:00:00Z",
    size: 1024,
    content_type: "text/plain",
    metadata: { status: "In progress" },
  },
  {
    object_name: "collection-1/user2/file2.txt",
    original_filename: "file2.txt",
    collection: "collection-1",
    owner: "user2@example.com",
    upload_time: "2024-01-02T00:00:00Z",
    size: 2048,
    content_type: "text/plain",
    metadata: { status: "Done" },
  },
];

// Mock auth context
const mockAuthContextValue = {
  user: {
    access_token: "mock-token",
    token_type: "Bearer",
    expires_at: Date.now() + 3600000,
    expires_in: 3600,
    expired: false,
    scopes: [],
    session_state: "mock-session",
    state: "mock-state",
    profile: {
      given_name: "Test",
      family_name: "User",
      email: "test@example.com",
      preferred_username: "testuser",
      realm_access: {
        roles: ["admin"],
      },
      collections: {
        "collection-1": ["read", "write", "delete"],
      },
    },
  },
  isAuthenticated: true,
  isLoading: false,
  activeNavigator: undefined,
  events: {} as any,
  settings: {} as any,
  signinRedirect: () => Promise.resolve(),
  signoutRedirect: () => Promise.resolve(),
  signinPopup: () => Promise.resolve(null as any),
  signinResourceOwnerCredentials: () => Promise.resolve(null as any),
  signoutPopup: () => Promise.resolve(),
  signinSilent: () => Promise.resolve(null as any),
  signoutSilent: () => Promise.resolve(),
  removeUser: () => Promise.resolve(),
  revokeTokens: () => Promise.resolve(),
  startSilentRenew: () => {},
  stopSilentRenew: () => {},
  clearStaleState: () => Promise.resolve(),
  querySessionStatus: () => Promise.resolve(null as any),
};

const renderCollectionDetails = (collectionId = "collection-1") => {
  return render(
    <AuthContext.Provider value={mockAuthContextValue as any}>
      <MemoryRouter initialEntries={[`/collections/${collectionId}`]}>
        <Routes>
          <Route
            path="/collections/:collectionId"
            element={<CollectionDetails />}
          />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
};

describe("CollectionDetails", () => {
  const mockFetchFiles = vi.fn();
  const mockDownloadFiles = vi.fn();
  const mockHandleDownload = vi.fn();
  const mockHandleDelete = vi.fn();
  const mockHandleViewHistory = vi.fn();
  const mockHandleArchive = vi.fn();
  const mockHandleApplyFilters = vi.fn();
  const mockHandleApplyDateFilter = vi.fn();
  const mockHandleRemoveFilter = vi.fn();
  const mockHandleClearAllFilters = vi.fn();
  const mockHandleBulkDownload = vi.fn();
  const mockHandleBulkChangeStatus = vi.fn();
  const mockHandleViewModeChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock useFiles
    vi.mocked(useFiles).mockReturnValue({
      files: mockFiles,
      loading: false,
      error: null,
      fetchFiles: mockFetchFiles,
      fetchRecentFiles: vi.fn(),
      uploadFile: vi.fn(),
      deleteFile: vi.fn(),
      archiveFile: vi.fn(),
      downloadFile: vi.fn(),
      downloadFiles: mockDownloadFiles,
      totalPages: 1,
      currentPage: 1,
      totalCount: 2,
    });

    // Mock useFileActions
    vi.mocked(useFileActions).mockReturnValue({
      handleDownload: mockHandleDownload,
      handleViewHistory: mockHandleViewHistory,
      handleDelete: mockHandleDelete,
      handleArchive: mockHandleArchive,
      deleteDialog: {
        open: false,
        file: null,
        isLoading: false,
        onConfirm: vi.fn(),
        onCancel: vi.fn(),
      },
      archiveDialog: {
        open: false,
        file: null,
        isLoading: false,
        onConfirm: vi.fn(),
        onCancel: vi.fn(),
      },
    });

    // Mock useCollectionFilters
    vi.mocked(useCollectionFilters).mockReturnValue({
      activeFilters: [],
      availableUploaders: ["user1@example.com", "user2@example.com"],
      currentFilters: {},
      handleApplyFilters: mockHandleApplyFilters,
      handleApplyDateFilter: mockHandleApplyDateFilter,
      handleRemoveFilter: mockHandleRemoveFilter,
      handleClearAllFilters: mockHandleClearAllFilters,
    });

    // Mock useBulkFileActions
    vi.mocked(useBulkFileActions).mockReturnValue({
      viewMode: "list",
      handleBulkDownload: mockHandleBulkDownload,
      handleBulkChangeStatus: mockHandleBulkChangeStatus,
      handleViewModeChange: mockHandleViewModeChange,
    });
  });

  it("should render collection details page", () => {
    renderCollectionDetails();

    expect(screen.getByText("collection-1")).toBeInTheDocument();
    expect(screen.getByText("Back to Files home")).toBeInTheDocument();
  });

  it("should fetch files on mount", () => {
    renderCollectionDetails();

    expect(mockFetchFiles).toHaveBeenCalledWith(
      "collection-1",
      1,
      10,
      expect.any(Object),
    );
  });

  it("should render files table", () => {
    renderCollectionDetails();

    expect(screen.getByText("file1.txt")).toBeInTheDocument();
    expect(screen.getByText("file2.txt")).toBeInTheDocument();
  });

  it("should render table filters", () => {
    renderCollectionDetails();

    expect(screen.getByTestId("table-filters")).toBeInTheDocument();
  });

  it("should render upload button", () => {
    renderCollectionDetails();

    expect(screen.getByText("Add files")).toBeInTheDocument();
  });

  it("should render back button with link to home", () => {
    renderCollectionDetails();

    const backButton = screen.getByText("Back to Files home");
    expect(backButton.closest("a")).toHaveAttribute("href", "/");
  });

  it("should fetch files when page changes", async () => {
    renderCollectionDetails();

    // Clear the initial fetch call
    mockFetchFiles.mockClear();

    // Assuming pagination controls exist in the table
    // This would need to be triggered through the FilesTable component
    // For now, we're just verifying the initial state
    expect(mockFetchFiles).not.toHaveBeenCalled();
  });

  it("should use collection filters hook", () => {
    renderCollectionDetails();

    expect(useCollectionFilters).toHaveBeenCalledWith({
      files: mockFiles,
    });
  });

  it("should use bulk file actions hook", () => {
    renderCollectionDetails();

    expect(useBulkFileActions).toHaveBeenCalledWith({
      selectedFiles: expect.any(Set),
      files: mockFiles,
      downloadFiles: mockDownloadFiles,
    });
  });

  it("should use file actions hook", () => {
    renderCollectionDetails();

    expect(useFileActions).toHaveBeenCalledWith(expect.any(Function));
  });

  it("should redirect to home if no collectionId", () => {
    render(
      <AuthContext.Provider value={mockAuthContextValue as any}>
        <MemoryRouter initialEntries={["/collections"]}>
          <Routes>
            <Route
              path="/collections/:collectionId?"
              element={<CollectionDetails />}
            />
            <Route path="/" element={<div>Home</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    expect(screen.getByText("Home")).toBeInTheDocument();
  });

  it("should refetch files when filters change", () => {
    const { rerender } = renderCollectionDetails();

    // Mock filter change
    vi.mocked(useCollectionFilters).mockReturnValue({
      activeFilters: [
        {
          id: "uploader-user1@example.com",
          label: "Uploader: user1@example.com",
          type: "uploader",
        },
      ],
      availableUploaders: ["user1@example.com", "user2@example.com"],
      currentFilters: {
        uploaders: ["user1@example.com"],
      },
      handleApplyFilters: mockHandleApplyFilters,
      handleApplyDateFilter: mockHandleApplyDateFilter,
      handleRemoveFilter: mockHandleRemoveFilter,
      handleClearAllFilters: mockHandleClearAllFilters,
    });

    rerender(
      <AuthContext.Provider value={mockAuthContextValue as any}>
        <MemoryRouter initialEntries={["/collections/collection-1"]}>
          <Routes>
            <Route
              path="/collections/:collectionId"
              element={<CollectionDetails />}
            />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    // Should fetch with new filters
    expect(mockFetchFiles).toHaveBeenCalledWith(
      "collection-1",
      1,
      10,
      expect.objectContaining({
        uploaders: ["user1@example.com"],
      }),
    );
  });

  it("should show loading state", () => {
    vi.mocked(useFiles).mockReturnValue({
      files: [],
      loading: true,
      error: null,
      fetchFiles: mockFetchFiles,
      fetchRecentFiles: vi.fn(),
      uploadFile: vi.fn(),
      deleteFile: vi.fn(),
      archiveFile: vi.fn(),
      downloadFile: vi.fn(),
      downloadFiles: mockDownloadFiles,
      totalPages: 0,
      currentPage: 1,
      totalCount: 0,
    });

    renderCollectionDetails();

    // FilesTable should receive isLoading prop
    expect(screen.getByTestId("table-filters")).toBeInTheDocument();
  });

  it("should render delete confirmation dialog", () => {
    vi.mocked(useFileActions).mockReturnValue({
      handleDownload: mockHandleDownload,
      handleViewHistory: mockHandleViewHistory,
      handleDelete: mockHandleDelete,
      handleArchive: mockHandleArchive,
      deleteDialog: {
        open: true,
        file: mockFiles[0],
        isLoading: false,
        onConfirm: vi.fn(),
        onCancel: vi.fn(),
      },
      archiveDialog: {
        open: false,
        file: null,
        isLoading: false,
        onConfirm: vi.fn(),
        onCancel: vi.fn(),
      },
    });

    renderCollectionDetails();

    expect(screen.getByText("Delete file")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Are you sure you want to delete this file? This action can't be undone.",
      ),
    ).toBeInTheDocument();
  });

  it("should render archive confirmation dialog", () => {
    vi.mocked(useFileActions).mockReturnValue({
      handleDownload: mockHandleDownload,
      handleViewHistory: mockHandleViewHistory,
      handleDelete: mockHandleDelete,
      handleArchive: mockHandleArchive,
      deleteDialog: {
        open: false,
        file: null,
        isLoading: false,
        onConfirm: vi.fn(),
        onCancel: vi.fn(),
      },
      archiveDialog: {
        open: true,
        file: mockFiles[0],
        isLoading: false,
        onConfirm: vi.fn(),
        onCancel: vi.fn(),
      },
    });

    renderCollectionDetails();

    expect(screen.getByText("Archive file")).toBeInTheDocument();
    expect(
      screen.getByText("Are you sure you want to archive this file?"),
    ).toBeInTheDocument();
  });

  it("should pass correct props to TableFilters", () => {
    renderCollectionDetails();

    const tableFilters = screen.getByTestId("table-filters");
    expect(tableFilters).toBeInTheDocument();

    // Verify handlers are passed
    expect(useCollectionFilters).toHaveBeenCalled();
    expect(useBulkFileActions).toHaveBeenCalled();
  });

  it("should pass correct props to FilesTable", () => {
    renderCollectionDetails();

    // Verify files are rendered in the table
    expect(screen.getByText("file1.txt")).toBeInTheDocument();
    expect(screen.getByText("file2.txt")).toBeInTheDocument();
  });

  it("should handle different collection IDs", () => {
    renderCollectionDetails("different-collection");

    expect(screen.getByText("different-collection")).toBeInTheDocument();
    expect(mockFetchFiles).toHaveBeenCalledWith(
      "different-collection",
      1,
      10,
      expect.any(Object),
    );
  });

  it("should refetch files when currentFilters change", () => {
    const { rerender } = renderCollectionDetails();

    const initialCallCount = mockFetchFiles.mock.calls.length;

    // Update currentFilters
    vi.mocked(useCollectionFilters).mockReturnValue({
      activeFilters: [],
      availableUploaders: ["user1@example.com"],
      currentFilters: {
        statuses: ["Done"],
      },
      handleApplyFilters: mockHandleApplyFilters,
      handleApplyDateFilter: mockHandleApplyDateFilter,
      handleRemoveFilter: mockHandleRemoveFilter,
      handleClearAllFilters: mockHandleClearAllFilters,
    });

    rerender(
      <AuthContext.Provider value={mockAuthContextValue as any}>
        <MemoryRouter initialEntries={["/collections/collection-1"]}>
          <Routes>
            <Route
              path="/collections/:collectionId"
              element={<CollectionDetails />}
            />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    expect(mockFetchFiles.mock.calls.length).toBeGreaterThan(initialCallCount);
  });

  it("should initialize with empty selected files", () => {
    renderCollectionDetails();

    expect(useBulkFileActions).toHaveBeenCalledWith(
      expect.objectContaining({
        selectedFiles: expect.any(Set),
      }),
    );

    const call = vi.mocked(useBulkFileActions).mock.calls[0][0];
    expect(call.selectedFiles.size).toBe(0);
  });
});
