import { useFilePermissions } from "@/hooks/file/useFilePermissions/useFilePermissions";
import type { File } from "@/types";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FileActions } from "./FileActions";

// Mock the useFilePermissions hook
vi.mock("@/hooks/file/useFilePermissions/useFilePermissions", () => ({
  useFilePermissions: vi.fn(),
}));

// Helper to create a mock file
function createMockFile(overrides?: Partial<File>): File {
  return {
    object_name: "test-file.txt",
    collection: "test-collection",
    owner: "test@example.com",
    original_filename: "test-file.txt",
    upload_time: "2024-01-01T00:00:00Z",
    content_type: "text/plain",
    size: 1024,
    ...overrides,
  };
}

describe("FileActions", () => {
  const mockOnDownload = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnViewHistory = vi.fn();
  const mockOnArchive = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("with full permissions (canDelete)", () => {
    beforeEach(() => {
      vi.mocked(useFilePermissions).mockReturnValue({
        canRead: true,
        canWrite: true,
        canDelete: true,
        canDownload: true,
        canArchive: true,
        canViewHistory: true,
        isOwnFile: true,
      });
    });

    it("renders all action options when all handlers provided", async () => {
      const user = userEvent.setup();
      const file = createMockFile();

      render(
        <FileActions
          file={file}
          onDownload={mockOnDownload}
          onDelete={mockOnDelete}
          onViewHistory={mockOnViewHistory}
          onArchive={mockOnArchive}
        />,
      );

      const trigger = screen.getByTestId("more-options-trigger");
      await user.click(trigger);

      expect(screen.getByTestId("more-options-content")).toBeInTheDocument();
      expect(screen.getByTestId("more-options-option-0-0")).toHaveTextContent(
        "Download",
      );
      expect(screen.getByTestId("more-options-option-0-1")).toHaveTextContent(
        "View History",
      );
      expect(screen.getByTestId("more-options-option-0-2")).toHaveTextContent(
        "Archive",
      );
      expect(screen.getByTestId("more-options-option-1-0")).toHaveTextContent(
        "Delete",
      );
    });

    it("omits View History when handler not provided", async () => {
      const user = userEvent.setup();
      const file = createMockFile();

      render(
        <FileActions
          file={file}
          onDownload={mockOnDownload}
          onDelete={mockOnDelete}
          onArchive={mockOnArchive}
        />,
      );

      const trigger = screen.getByTestId("more-options-trigger");
      await user.click(trigger);

      expect(screen.getByTestId("more-options-content")).toBeInTheDocument();
      expect(screen.getByTestId("more-options-option-0-0")).toHaveTextContent(
        "Download",
      );
      expect(screen.queryByText("View History")).not.toBeInTheDocument();
      expect(screen.getByTestId("more-options-option-0-1")).toHaveTextContent(
        "Archive",
      );
      expect(screen.getByTestId("more-options-option-1-0")).toHaveTextContent(
        "Delete",
      );
    });

    it("omits Archive when handler not provided", async () => {
      const user = userEvent.setup();
      const file = createMockFile();

      render(
        <FileActions
          file={file}
          onDownload={mockOnDownload}
          onDelete={mockOnDelete}
          onViewHistory={mockOnViewHistory}
        />,
      );

      const trigger = screen.getByTestId("more-options-trigger");
      await user.click(trigger);

      expect(screen.getByTestId("more-options-content")).toBeInTheDocument();
      expect(screen.getByTestId("more-options-option-0-0")).toHaveTextContent(
        "Download",
      );
      expect(screen.getByTestId("more-options-option-0-1")).toHaveTextContent(
        "View History",
      );
      expect(screen.queryByText("Archive")).not.toBeInTheDocument();
      expect(screen.getByTestId("more-options-option-1-0")).toHaveTextContent(
        "Delete",
      );
    });

    it("calls onDownload with correct file when Download clicked", async () => {
      const user = userEvent.setup();
      const file = createMockFile();

      render(
        <FileActions
          file={file}
          onDownload={mockOnDownload}
          onDelete={mockOnDelete}
        />,
      );

      await user.click(screen.getByTestId("more-options-trigger"));
      const downloadOption = screen.getByTestId("more-options-option-0-0");
      expect(downloadOption).toHaveTextContent("Download");
      await user.click(downloadOption);

      expect(mockOnDownload).toHaveBeenCalledWith(file);
      expect(mockOnDownload).toHaveBeenCalledTimes(1);
    });

    it("calls onViewHistory with correct file when View History clicked", async () => {
      const user = userEvent.setup();
      const file = createMockFile();

      render(
        <FileActions
          file={file}
          onDownload={mockOnDownload}
          onDelete={mockOnDelete}
          onViewHistory={mockOnViewHistory}
        />,
      );

      await user.click(screen.getByTestId("more-options-trigger"));
      const viewHistoryOption = screen.getByTestId("more-options-option-0-1");
      expect(viewHistoryOption).toHaveTextContent("View History");
      await user.click(viewHistoryOption);

      expect(mockOnViewHistory).toHaveBeenCalledWith(file);
      expect(mockOnViewHistory).toHaveBeenCalledTimes(1);
    });

    it("calls onArchive with correct file when Archive clicked", async () => {
      const user = userEvent.setup();
      const file = createMockFile();

      render(
        <FileActions
          file={file}
          onDownload={mockOnDownload}
          onDelete={mockOnDelete}
          onArchive={mockOnArchive}
        />,
      );

      await user.click(screen.getByTestId("more-options-trigger"));
      const archiveOption = screen.getByTestId("more-options-option-0-1");
      expect(archiveOption).toHaveTextContent("Archive");
      await user.click(archiveOption);

      expect(mockOnArchive).toHaveBeenCalledWith(file);
      expect(mockOnArchive).toHaveBeenCalledTimes(1);
    });

    it("calls onDelete with correct file when Delete clicked", async () => {
      const user = userEvent.setup();
      const file = createMockFile();

      render(
        <FileActions
          file={file}
          onDownload={mockOnDownload}
          onDelete={mockOnDelete}
        />,
      );

      await user.click(screen.getByTestId("more-options-trigger"));
      const deleteOption = screen.getByTestId("more-options-option-1-0");
      expect(deleteOption).toHaveTextContent("Delete");
      await user.click(deleteOption);

      expect(mockOnDelete).toHaveBeenCalledWith(file);
      expect(mockOnDelete).toHaveBeenCalledTimes(1);
    });

    it("renders Delete option with destructive styling", async () => {
      const user = userEvent.setup();
      const file = createMockFile();

      render(
        <FileActions
          file={file}
          onDownload={mockOnDownload}
          onDelete={mockOnDelete}
        />,
      );

      await user.click(screen.getByTestId("more-options-trigger"));

      // The Delete option should be in the second group (index 1, option 0)
      const deleteOption = screen.getByTestId("more-options-option-1-0");
      expect(deleteOption).toHaveClass("text-destructive");
    });
  });

  describe("with download-only permissions (canDownload)", () => {
    beforeEach(() => {
      vi.mocked(useFilePermissions).mockReturnValue({
        canRead: true,
        canWrite: false,
        canDelete: false,
        canDownload: true,
        canArchive: false,
        canViewHistory: false,
        isOwnFile: false,
      });
    });

    it("renders only Download option", async () => {
      const user = userEvent.setup();
      const file = createMockFile();

      render(
        <FileActions
          file={file}
          onDownload={mockOnDownload}
          onDelete={mockOnDelete}
          onViewHistory={mockOnViewHistory}
          onArchive={mockOnArchive}
        />,
      );

      await user.click(screen.getByTestId("more-options-trigger"));

      expect(screen.getByTestId("more-options-content")).toBeInTheDocument();
      expect(screen.getByTestId("more-options-option-0-0")).toHaveTextContent(
        "Download",
      );
      expect(screen.queryByText("View History")).not.toBeInTheDocument();
      expect(screen.queryByText("Archive")).not.toBeInTheDocument();
      expect(screen.queryByText("Delete")).not.toBeInTheDocument();
    });

    it("calls onDownload when Download clicked", async () => {
      const user = userEvent.setup();
      const file = createMockFile();

      render(
        <FileActions
          file={file}
          onDownload={mockOnDownload}
          onDelete={mockOnDelete}
        />,
      );

      await user.click(screen.getByTestId("more-options-trigger"));
      const downloadOption = screen.getByTestId("more-options-option-0-0");
      expect(downloadOption).toHaveTextContent("Download");
      await user.click(downloadOption);

      expect(mockOnDownload).toHaveBeenCalledWith(file);
      expect(mockOnDownload).toHaveBeenCalledTimes(1);
    });
  });

  describe("with no permissions", () => {
    beforeEach(() => {
      vi.mocked(useFilePermissions).mockReturnValue({
        canRead: false,
        canWrite: false,
        canDelete: false,
        canDownload: false,
        canArchive: false,
        canViewHistory: false,
        isOwnFile: false,
      });
    });

    it("renders only disabled 'No actions available' option", async () => {
      const user = userEvent.setup();
      const file = createMockFile();

      render(
        <FileActions
          file={file}
          onDownload={mockOnDownload}
          onDelete={mockOnDelete}
        />,
      );

      await user.click(screen.getByTestId("more-options-trigger"));

      expect(screen.getByTestId("more-options-content")).toBeInTheDocument();
      expect(screen.getByTestId("more-options-option-0-0")).toHaveTextContent(
        "No actions available",
      );
      expect(screen.queryByText("Download")).not.toBeInTheDocument();
      expect(screen.queryByText("Delete")).not.toBeInTheDocument();
    });

    it("renders disabled option with correct attributes", async () => {
      const user = userEvent.setup();
      const file = createMockFile();

      render(
        <FileActions
          file={file}
          onDownload={mockOnDownload}
          onDelete={mockOnDelete}
        />,
      );

      await user.click(screen.getByTestId("more-options-trigger"));

      const option = screen.getByTestId("more-options-option-0-0");
      expect(option).toHaveAttribute("data-disabled");
      expect(option).toHaveAttribute("aria-disabled", "true");
    });
  });
});
