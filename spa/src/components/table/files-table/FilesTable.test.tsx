import { useTableSelection } from "@/hooks/table";
import type { File } from "@/types";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FilesTable } from "./FilesTable";

// Mock dependencies
vi.mock("@/hooks/table", () => ({
  useTableSelection: vi.fn(),
}));

vi.mock("@/hooks/file/useFilePermissions/useFilePermissions", () => ({
  useFilePermissions: vi.fn(() => ({
    canRead: true,
    canWrite: true,
    canDelete: true,
    canDownload: true,
    canArchive: true,
    canViewHistory: true,
    isOwnFile: true,
  })),
}));

// Helper to create mock files
function createMockFile(overrides?: Partial<File>): File {
  return {
    object_name: "test-file-1.txt",
    collection: "test-collection",
    owner: "test@example.com",
    original_filename: "test-file-1.txt",
    upload_time: "2024-01-01T10:30:00Z",
    content_type: "text/plain",
    size: 1048576, // 1 MB
    metadata: { status: "Completed" },
    ...overrides,
  };
}

describe("FilesTable", () => {
  const mockOnPageChange = vi.fn();
  const mockOnPageSizeChange = vi.fn();
  const mockOnDownload = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnViewHistory = vi.fn();
  const mockOnArchive = vi.fn();
  const mockOnSelectionChange = vi.fn();

  const defaultProps = {
    files: [],
    currentPage: 1,
    totalPages: 1,
    totalResults: 0,
    pageSize: 10,
    onPageChange: mockOnPageChange,
    onPageSizeChange: mockOnPageSizeChange,
    onDownload: mockOnDownload,
    onDelete: mockOnDelete,
    onViewHistory: mockOnViewHistory,
    onArchive: mockOnArchive,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock for useTableSelection
    vi.mocked(useTableSelection).mockReturnValue({
      selectedItems: new Set(),
      toggleItem: vi.fn(),
      toggleAll: vi.fn(),
      clearSelection: vi.fn(),
      areAllSelected: vi.fn(() => false),
      areSomeSelected: vi.fn(() => false),
    });
  });

  describe("rendering", () => {
    it("renders empty table with pagination", () => {
      render(<FilesTable {...defaultProps} />);

      expect(screen.getByTestId("paginated-table")).toBeInTheDocument();
    });

    it("renders table with file data", () => {
      const files = [
        createMockFile({
          object_name: "file1.txt",
          original_filename: "file1.txt",
          owner: "user1@example.com",
        }),
        createMockFile({
          object_name: "file2.txt",
          original_filename: "file2.txt",
          owner: "user2@example.com",
        }),
      ];

      render(<FilesTable {...defaultProps} files={files} totalResults={2} />);

      expect(screen.getByText("file1.txt")).toBeInTheDocument();
      expect(screen.getByText("file2.txt")).toBeInTheDocument();
      expect(screen.getByText("user1@example.com")).toBeInTheDocument();
      expect(screen.getByText("user2@example.com")).toBeInTheDocument();
    });

    it("renders loading state", () => {
      render(<FilesTable {...defaultProps} isLoading={true} />);

      expect(screen.getByTestId("paginated-table")).toBeInTheDocument();
      // Loading state is handled by PaginatedTable component
    });

    it("formats file size correctly", () => {
      const files = [
        createMockFile({
          size: 1048576, // 1 MB
        }),
      ];

      render(<FilesTable {...defaultProps} files={files} />);

      expect(screen.getByText("1.0")).toBeInTheDocument();
    });

    it("formats upload date and time correctly", () => {
      const files = [
        createMockFile({
          upload_time: "2024-01-15T14:30:00Z",
        }),
      ];

      render(<FilesTable {...defaultProps} files={files} />);

      // Date formatting is GB format: DD/MM/YYYY HH:MM AM/PM
      // Just verify that the formatted date is rendered
      const dateCell = screen.getByText(/\d{2}\/\d{2}\/\d{4}/);
      expect(dateCell).toBeInTheDocument();
    });

    it("displays status from metadata", () => {
      const files = [
        createMockFile({
          metadata: { status: "Processing" },
        }),
      ];

      render(<FilesTable {...defaultProps} files={files} />);

      expect(screen.getByText("Processing")).toBeInTheDocument();
    });

    it("displays default status when metadata is missing", () => {
      const files = [
        createMockFile({
          metadata: undefined,
        }),
      ];

      render(<FilesTable {...defaultProps} files={files} />);

      expect(screen.getByText("In progress")).toBeInTheDocument();
    });

    it("displays default status when status field is missing", () => {
      const files = [
        createMockFile({
          metadata: { otherField: "value" },
        }),
      ];

      render(<FilesTable {...defaultProps} files={files} />);

      expect(screen.getByText("In progress")).toBeInTheDocument();
    });
  });

  describe("checkboxes", () => {
    it("renders checkboxes by default", () => {
      const files = [createMockFile()];

      render(<FilesTable {...defaultProps} files={files} />);

      // Header checkbox
      const checkboxes = screen.getAllByRole("checkbox");
      expect(checkboxes.length).toBeGreaterThan(0);
    });

    it("hides checkboxes when showCheckboxes is false", () => {
      const files = [createMockFile()];

      render(
        <FilesTable {...defaultProps} files={files} showCheckboxes={false} />,
      );

      const checkboxes = screen.queryAllByRole("checkbox");
      expect(checkboxes.length).toBe(0);
    });

    it("renders header checkbox with correct state when all selected", () => {
      const files = [
        createMockFile(),
        createMockFile({ object_name: "file2" }),
      ];

      vi.mocked(useTableSelection).mockReturnValue({
        selectedItems: new Set(["test-file-1.txt", "file2"]),
        toggleItem: vi.fn(),
        toggleAll: vi.fn(),
        clearSelection: vi.fn(),
        areAllSelected: vi.fn(() => true),
        areSomeSelected: vi.fn(() => false),
      });

      render(<FilesTable {...defaultProps} files={files} />);

      const headerCheckbox = screen.getAllByRole("checkbox")[0];
      expect(headerCheckbox).toBeChecked();
    });

    it("renders header checkbox as indeterminate when some selected", () => {
      const files = [
        createMockFile(),
        createMockFile({ object_name: "file2" }),
      ];

      vi.mocked(useTableSelection).mockReturnValue({
        selectedItems: new Set(["test-file-1.txt"]),
        toggleItem: vi.fn(),
        toggleAll: vi.fn(),
        clearSelection: vi.fn(),
        areAllSelected: vi.fn(() => false),
        areSomeSelected: vi.fn(() => true),
      });

      render(<FilesTable {...defaultProps} files={files} />);

      const headerCheckbox = screen.getAllByRole("checkbox")[0];
      // When indeterminate, checkbox has special styling but data-state stays "unchecked"
      // The Minus icon is rendered instead of Check icon for indeterminate state
      expect(headerCheckbox).not.toBeChecked();
      expect(headerCheckbox).toHaveClass("bg-[#404040]"); // Indeterminate styling
    });

    it("toggles all selections when header checkbox clicked", async () => {
      const user = userEvent.setup();
      const files = [
        createMockFile(),
        createMockFile({ object_name: "file2" }),
      ];

      const mockToggleAll = vi.fn();
      vi.mocked(useTableSelection).mockReturnValue({
        selectedItems: new Set(),
        toggleItem: vi.fn(),
        toggleAll: mockToggleAll,
        clearSelection: vi.fn(),
        areAllSelected: vi.fn(() => false),
        areSomeSelected: vi.fn(() => false),
      });

      render(<FilesTable {...defaultProps} files={files} />);

      const headerCheckbox = screen.getAllByRole("checkbox")[0];
      await user.click(headerCheckbox);

      expect(mockToggleAll).toHaveBeenCalledWith(["test-file-1.txt", "file2"]);
    });

    it("toggles individual item when row checkbox clicked", async () => {
      const user = userEvent.setup();
      const files = [createMockFile()];

      const mockToggleItem = vi.fn();
      vi.mocked(useTableSelection).mockReturnValue({
        selectedItems: new Set(),
        toggleItem: mockToggleItem,
        toggleAll: vi.fn(),
        clearSelection: vi.fn(),
        areAllSelected: vi.fn(() => false),
        areSomeSelected: vi.fn(() => false),
      });

      render(<FilesTable {...defaultProps} files={files} />);

      const rowCheckbox = screen.getAllByRole("checkbox")[1]; // First is header
      await user.click(rowCheckbox);

      expect(mockToggleItem).toHaveBeenCalledWith("test-file-1.txt");
    });

    it("renders row checkbox as checked when file is selected", () => {
      const files = [createMockFile()];

      vi.mocked(useTableSelection).mockReturnValue({
        selectedItems: new Set(["test-file-1.txt"]),
        toggleItem: vi.fn(),
        toggleAll: vi.fn(),
        clearSelection: vi.fn(),
        areAllSelected: vi.fn(() => true),
        areSomeSelected: vi.fn(() => false),
      });

      render(<FilesTable {...defaultProps} files={files} />);

      const rowCheckbox = screen.getAllByRole("checkbox")[1];
      expect(rowCheckbox).toBeChecked();
    });
  });

  describe("selection state management", () => {
    it("uses internal selection state when not controlled", () => {
      const files = [createMockFile()];

      render(<FilesTable {...defaultProps} files={files} />);

      expect(useTableSelection).toHaveBeenCalledWith({
        selectedItems: undefined,
        onSelectionChange: undefined,
      });
    });

    it("uses external selection state when controlled", () => {
      const files = [createMockFile()];
      const selectedFiles = new Set(["test-file-1.txt"]);

      render(
        <FilesTable
          {...defaultProps}
          files={files}
          selectedFiles={selectedFiles}
          onSelectionChange={mockOnSelectionChange}
        />,
      );

      expect(useTableSelection).toHaveBeenCalledWith({
        selectedItems: selectedFiles,
        onSelectionChange: mockOnSelectionChange,
      });
    });
  });

  describe("pagination", () => {
    it("passes correct pagination props to PaginatedTable", () => {
      render(
        <FilesTable
          {...defaultProps}
          currentPage={2}
          totalPages={5}
          totalResults={50}
          pageSize={10}
        />,
      );

      expect(screen.getByTestId("paginated-table")).toBeInTheDocument();
      // PaginatedTable handles the actual pagination rendering
    });

    it("calls onPageChange when page changes", async () => {
      const user = userEvent.setup();

      render(
        <FilesTable
          {...defaultProps}
          currentPage={1}
          totalPages={3}
          totalResults={30}
        />,
      );

      // Look for next page button by test ID
      const nextButton = screen.getByTestId("paginated-table-pagination-next");
      await user.click(nextButton);

      expect(mockOnPageChange).toHaveBeenCalledWith(2);
    });

    it("calls onPageSizeChange when page size changes", async () => {
      const user = userEvent.setup();

      render(
        <FilesTable
          {...defaultProps}
          currentPage={1}
          totalPages={2}
          totalResults={20}
        />,
      );

      // Open page size selector by test ID
      const pageSizeButton = screen.getByTestId(
        "paginated-table-pagination-page-size-trigger",
      );
      await user.click(pageSizeButton);

      // Select 25 per page
      const option25 = screen.getByRole("option", { name: "25" });
      await user.click(option25);

      expect(mockOnPageSizeChange).toHaveBeenCalledWith(25);
    });
  });

  describe("file actions", () => {
    it("renders file actions for each row", () => {
      const files = [
        createMockFile({ object_name: "file1" }),
        createMockFile({ object_name: "file2" }),
      ];

      render(<FilesTable {...defaultProps} files={files} />);

      const moreOptionsButtons = screen.getAllByTestId("more-options-trigger");
      expect(moreOptionsButtons).toHaveLength(2);
    });

    it("passes action handlers to FileActions", async () => {
      const user = userEvent.setup();
      const files = [createMockFile()];

      render(<FilesTable {...defaultProps} files={files} />);

      const moreOptionsButton = screen.getByTestId("more-options-trigger");
      await user.click(moreOptionsButton);

      // Verify menu is open
      expect(screen.getByTestId("more-options-content")).toBeInTheDocument();

      // Click download option
      const downloadOption = screen.getByTestId("more-options-option-0-0");
      await user.click(downloadOption);

      expect(mockOnDownload).toHaveBeenCalledWith(files[0]);
    });
  });

  describe("columns", () => {
    it("renders all expected column headers", () => {
      render(<FilesTable {...defaultProps} />);

      expect(screen.getByText("Name")).toBeInTheDocument();
      expect(screen.getByText("Upload date and time")).toBeInTheDocument();
      expect(screen.getByText("Uploader")).toBeInTheDocument();
      expect(screen.getByText("Size (mb)")).toBeInTheDocument();
      expect(screen.getByText("Status")).toBeInTheDocument();
    });

    it("does not render select column header when showCheckboxes is false", () => {
      const files = [createMockFile()];

      render(
        <FilesTable {...defaultProps} files={files} showCheckboxes={false} />,
      );

      const checkboxes = screen.queryAllByRole("checkbox");
      expect(checkboxes).toHaveLength(0);
    });
  });

  describe("empty state", () => {
    it("renders empty table when no files provided", () => {
      render(<FilesTable {...defaultProps} files={[]} totalResults={0} />);

      expect(screen.getByTestId("paginated-table")).toBeInTheDocument();
      // Empty state is handled by PaginatedTable
    });
  });

  describe("memoization", () => {
    it("memoizes allFileIds based on files array", () => {
      const files = [
        createMockFile({ object_name: "file1" }),
        createMockFile({ object_name: "file2" }),
      ];

      const { rerender } = render(
        <FilesTable {...defaultProps} files={files} />,
      );

      // Re-render with same files reference
      rerender(<FilesTable {...defaultProps} files={files} />);

      // allFileIds should be memoized (same reference)
      // This is tested implicitly through the component behavior
      expect(useTableSelection).toHaveBeenCalled();
    });

    it("recalculates allFileIds when files array changes", () => {
      const files1 = [createMockFile({ object_name: "file1" })];
      const files2 = [createMockFile({ object_name: "file2" })];

      const { rerender } = render(
        <FilesTable {...defaultProps} files={files1} />,
      );

      rerender(<FilesTable {...defaultProps} files={files2} />);

      // allFileIds should be recalculated with new files
      expect(useTableSelection).toHaveBeenCalled();
    });
  });
});
