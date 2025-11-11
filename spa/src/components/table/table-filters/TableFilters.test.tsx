import { fireEvent, render, screen } from "@testing-library/react";
import type { ActiveFilter } from "./TableFilters";
import { TableFilters } from "./TableFilters";

describe("TableFilters", () => {
  const mockOnDownload = vi.fn();
  const mockOnChangeStatus = vi.fn();
  const mockOnSortChange = vi.fn();
  const mockOnViewModeChange = vi.fn();
  const mockOnApplyFilters = vi.fn();
  const mockOnApplyDateFilter = vi.fn();
  const mockOnRemoveFilter = vi.fn();
  const mockOnClearAllFilters = vi.fn();

  const defaultProps = {
    selectedCount: 0,
    sortValue: "name",
    sortOptions: [
      { value: "name", label: "Name" },
      { value: "date", label: "Date" },
    ],
    viewMode: "list" as const,
    showViewToggle: true,
    activeFilters: [] as ActiveFilter[],
    availableUploaders: ["user1@example.com", "user2@example.com"],
    onDownload: mockOnDownload,
    onChangeStatus: mockOnChangeStatus,
    onSortChange: mockOnSortChange,
    onViewModeChange: mockOnViewModeChange,
    onApplyFilters: mockOnApplyFilters,
    onApplyDateFilter: mockOnApplyDateFilter,
    onRemoveFilter: mockOnRemoveFilter,
    onClearAllFilters: mockOnClearAllFilters,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render table filters component", () => {
    render(<TableFilters {...defaultProps} />);
    expect(screen.getByTestId("table-filters")).toBeInTheDocument();
  });

  it("should render filter dropdown when no active filters", () => {
    render(<TableFilters {...defaultProps} />);
    expect(
      screen.getByTestId("table-filters-filters-trigger"),
    ).toBeInTheDocument();
  });

  it("should render active state when there are active filters", () => {
    const activeFilters: ActiveFilter[] = [
      { id: "uploader-user1", label: "Uploader: user1", type: "uploader" },
    ];
    render(<TableFilters {...defaultProps} activeFilters={activeFilters} />);

    expect(screen.getByText("Filters")).toBeInTheDocument();
    expect(screen.getByText("Clear all")).toBeInTheDocument();
  });

  it("should render bulk actions", () => {
    render(<TableFilters {...defaultProps} selectedCount={3} />);
    expect(screen.getByTestId("table-filters-download")).toBeInTheDocument();
    expect(
      screen.getByTestId("table-filters-change-status-trigger"),
    ).toBeInTheDocument();
  });

  it("should render sort control when sortOptions provided", () => {
    render(<TableFilters {...defaultProps} />);
    expect(screen.getByTestId("table-filters-sort")).toBeInTheDocument();
  });

  it("should not render sort control when sortOptions empty", () => {
    render(<TableFilters {...defaultProps} sortOptions={[]} />);
    expect(screen.queryByTestId("table-filters-sort")).not.toBeInTheDocument();
  });

  it("should render view toggle when showViewToggle is true", () => {
    render(<TableFilters {...defaultProps} showViewToggle={true} />);
    expect(screen.getByTestId("table-filters-view-toggle")).toBeInTheDocument();
  });

  it("should not render view toggle when showViewToggle is false", () => {
    render(<TableFilters {...defaultProps} showViewToggle={false} />);
    expect(
      screen.queryByTestId("table-filters-view-toggle"),
    ).not.toBeInTheDocument();
  });

  it("should render filter chips when there are active filters", () => {
    const activeFilters: ActiveFilter[] = [
      { id: "uploader-user1", label: "Uploader: user1", type: "uploader" },
      { id: "status-Done", label: "Status: Done", type: "status" },
    ];
    render(<TableFilters {...defaultProps} activeFilters={activeFilters} />);

    expect(screen.getByTestId("table-filters-chips")).toBeInTheDocument();
    expect(screen.getByText("Uploader: user1")).toBeInTheDocument();
    expect(screen.getByText("Status: Done")).toBeInTheDocument();
  });

  it("should call onClearAllFilters when Clear all button is clicked", () => {
    const activeFilters: ActiveFilter[] = [
      { id: "uploader-user1", label: "Uploader: user1", type: "uploader" },
    ];
    render(<TableFilters {...defaultProps} activeFilters={activeFilters} />);

    const clearAllButton = screen.getByText("Clear all");
    fireEvent.click(clearAllButton);

    expect(mockOnClearAllFilters).toHaveBeenCalled();
  });

  it("should call onDownload when download button is clicked", () => {
    render(<TableFilters {...defaultProps} selectedCount={2} />);

    const downloadButton = screen.getByTestId("table-filters-download");
    fireEvent.click(downloadButton);

    expect(mockOnDownload).toHaveBeenCalled();
  });

  it("should call onViewModeChange when view toggle is clicked", () => {
    render(<TableFilters {...defaultProps} viewMode="list" />);

    const gridButton = screen.getByTestId("table-filters-view-toggle-grid");
    fireEvent.click(gridButton);

    expect(mockOnViewModeChange).toHaveBeenCalledWith("grid");
  });

  it("should render filter dropdown trigger", () => {
    render(<TableFilters {...defaultProps} />);

    const filterTrigger = screen.getByTestId("table-filters-filters-trigger");
    expect(filterTrigger).toBeInTheDocument();
  });

  it("should handle filter chip removal", () => {
    const activeFilters: ActiveFilter[] = [
      { id: "uploader-user1", label: "Uploader: user1", type: "uploader" },
    ];
    render(<TableFilters {...defaultProps} activeFilters={activeFilters} />);

    const removeButton = screen.getByTestId(
      "table-filters-chips-remove-uploader-user1",
    );
    fireEvent.click(removeButton);

    expect(mockOnRemoveFilter).toHaveBeenCalledWith("uploader-user1");
  });

  it("should use custom testId", () => {
    render(<TableFilters {...defaultProps} testId="custom-filters" />);
    expect(screen.getByTestId("custom-filters")).toBeInTheDocument();
  });

  it("should disable bulk actions when selectedCount is 0", () => {
    render(<TableFilters {...defaultProps} selectedCount={0} />);

    const downloadButton = screen.getByTestId("table-filters-download");
    const changeStatusButton = screen.getByTestId(
      "table-filters-change-status-trigger",
    );

    expect(downloadButton).toBeDisabled();
    expect(changeStatusButton).toBeDisabled();
  });

  it("should enable bulk actions when selectedCount is greater than 0", () => {
    render(<TableFilters {...defaultProps} selectedCount={5} />);

    const downloadButton = screen.getByTestId("table-filters-download");
    const changeStatusButton = screen.getByTestId(
      "table-filters-change-status-trigger",
    );

    expect(downloadButton).not.toBeDisabled();
    expect(changeStatusButton).not.toBeDisabled();
  });

  it("should render with grid view mode", () => {
    render(<TableFilters {...defaultProps} viewMode="grid" />);

    const gridButton = screen.getByTestId("table-filters-view-toggle-grid");
    expect(gridButton.className).toContain("bg-white");
  });

  it("should render without view toggle when showViewToggle is false", () => {
    render(<TableFilters {...defaultProps} showViewToggle={false} />);

    expect(
      screen.queryByTestId("table-filters-view-toggle"),
    ).not.toBeInTheDocument();
  });
});
