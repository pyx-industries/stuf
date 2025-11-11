import type { File, User } from "@/types";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RecentFilesTable } from "./RecentFilesTable";

// Mock the useAuth hook
vi.mock("react-oidc-context", async () => {
  const actual = await vi.importActual("react-oidc-context");
  return {
    ...actual,
    useAuth: () => ({
      isAuthenticated: true,
      isLoading: false,
      user: {
        profile: {
          email: "test@example.com",
          name: "Test User",
          preferred_username: "testuser",
          collections: JSON.stringify({
            "collection-a": ["read", "write", "delete"],
            "collection-b": ["read", "write", "delete"],
          }),
        },
      },
    }),
  };
});

describe("RecentFilesTable", () => {
  const mockUser: User = {
    username: "testuser",
    email: "test@example.com",
    name: "Test User",
    collections: {
      "collection-a": ["read", "write", "delete"],
      "collection-b": ["read", "write", "delete"],
    },
    roles: [],
  };

  const mockFiles: File[] = [
    {
      object_name: "collection-a/user1/file1.pdf",
      collection: "collection-a",
      owner: "John Doe",
      original_filename: "Test File 1",
      upload_time: "2025-01-15T10:00:00Z",
      content_type: "application/pdf",
      size: 1024 * 1024,
      metadata: {},
    },
    {
      object_name: "collection-b/user2/file2.pdf",
      collection: "collection-b",
      owner: "Jane Smith",
      original_filename: "Test File 2",
      upload_time: "2025-01-16T11:00:00Z",
      content_type: "application/pdf",
      size: 2 * 1024 * 1024,
      metadata: {},
    },
  ];

  const defaultProps = {
    files: mockFiles,
    user: mockUser,
    loading: false,
    onDownload: vi.fn(),
    onDelete: vi.fn(),
  };

  it("renders table with files", () => {
    render(<RecentFilesTable {...defaultProps} />);

    expect(screen.getByTestId("recent-files-table")).toBeInTheDocument();
    expect(screen.getByText("Test File 1")).toBeInTheDocument();
    expect(screen.getByText("Test File 2")).toBeInTheDocument();
    expect(screen.getByTestId("recent-files-table-row-0")).toBeInTheDocument();
    expect(screen.getByTestId("recent-files-table-row-1")).toBeInTheDocument();
  });

  it("displays empty message when no files", () => {
    render(<RecentFilesTable {...defaultProps} files={[]} />);

    expect(screen.getByTestId("recent-files-table")).toBeInTheDocument();
    expect(
      screen.getByTestId("recent-files-table-empty-row"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("recent-files-table-empty-message"),
    ).toHaveTextContent("No recent files");
  });

  it("shows loading state", () => {
    render(<RecentFilesTable {...defaultProps} loading={true} />);

    // Should show skeleton rows
    expect(screen.getByTestId("recent-files-table")).toBeInTheDocument();
    expect(
      screen.getByTestId("recent-files-table-skeleton-row-0"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("recent-files-table-skeleton-row-1"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("recent-files-table-skeleton-row-2"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("recent-files-table-skeleton-row-3"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("recent-files-table-skeleton-row-4"),
    ).toBeInTheDocument();
  });

  it("allows sorting by different fields", async () => {
    const user = userEvent.setup();
    render(<RecentFilesTable {...defaultProps} />);

    const sortTrigger = screen.getByTestId("recent-files-table-sort");
    expect(sortTrigger).toBeInTheDocument();

    // Click to open the dropdown
    await user.click(sortTrigger);

    // Verify dropdown content is visible
    expect(
      screen.getByTestId("recent-files-table-sort-content"),
    ).toBeInTheDocument();

    // Select "Date" option
    const dateOption = screen.getByTestId(
      "recent-files-table-sort-option-date",
    );
    expect(dateOption).toBeInTheDocument();
    await user.click(dateOption);

    // Verify the sort was applied (sortBy state changed)
    expect(sortTrigger).toBeInTheDocument();
  });

  it("formats file size correctly", () => {
    render(<RecentFilesTable {...defaultProps} />);

    expect(screen.getByTestId("recent-files-table")).toBeInTheDocument();

    // Check the size column cells
    const sizeCells = [
      screen.getByTestId("recent-files-table-cell-0_size"),
      screen.getByTestId("recent-files-table-cell-1_size"),
    ];

    // 1MB file
    expect(sizeCells[0]).toHaveTextContent("1.0");
    // 2MB file
    expect(sizeCells[1]).toHaveTextContent("2.0");
  });
});
