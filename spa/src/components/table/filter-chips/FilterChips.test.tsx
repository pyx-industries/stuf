import type { ActiveFilter } from "@/components/table/table-filters/TableFilters";
import { fireEvent, render, screen } from "@testing-library/react";
import { FilterChips } from "./FilterChips";

describe("FilterChips", () => {
  const mockOnRemoveFilter = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render nothing when no filters are provided", () => {
    const { container } = render(<FilterChips filters={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("should render filter chips", () => {
    const filters: ActiveFilter[] = [
      { id: "uploader-user1", label: "Uploader: user1", type: "uploader" },
      { id: "status-Done", label: "Status: Done", type: "status" },
    ];

    render(<FilterChips filters={filters} />);
    expect(screen.getByText("Uploader: user1")).toBeInTheDocument();
    expect(screen.getByText("Status: Done")).toBeInTheDocument();
  });

  it("should render date icon for date filters", () => {
    const filters: ActiveFilter[] = [
      {
        id: "date-2024-01-01-2024-01-31",
        label: "Jan 1, 2024 – Jan 31, 2024",
        type: "date",
      },
    ];

    render(<FilterChips filters={filters} />);
    expect(screen.getByText("Jan 1, 2024 – Jan 31, 2024")).toBeInTheDocument();
    // Check for SVG calendar icon
    const chip = screen.getByTestId(
      "filter-chips-chip-date-2024-01-01-2024-01-31",
    );
    expect(chip.querySelector("svg")).toBeInTheDocument();
  });

  it("should not render date icon for non-date filters", () => {
    const filters: ActiveFilter[] = [
      { id: "uploader-user1", label: "Uploader: user1", type: "uploader" },
    ];

    render(<FilterChips filters={filters} />);
    const chip = screen.getByTestId("filter-chips-chip-uploader-user1");
    expect(chip.querySelector("svg")).not.toBeInTheDocument();
  });

  it("should render remove buttons when onRemoveFilter is provided", () => {
    const filters: ActiveFilter[] = [
      { id: "uploader-user1", label: "Uploader: user1", type: "uploader" },
    ];

    render(
      <FilterChips filters={filters} onRemoveFilter={mockOnRemoveFilter} />,
    );
    expect(
      screen.getByTestId("filter-chips-remove-uploader-user1"),
    ).toBeInTheDocument();
  });

  it("should not render remove buttons when onRemoveFilter is not provided", () => {
    const filters: ActiveFilter[] = [
      { id: "uploader-user1", label: "Uploader: user1", type: "uploader" },
    ];

    render(<FilterChips filters={filters} />);
    expect(
      screen.queryByTestId("filter-chips-remove-uploader-user1"),
    ).not.toBeInTheDocument();
  });

  it("should call onRemoveFilter when remove button is clicked", () => {
    const filters: ActiveFilter[] = [
      { id: "uploader-user1", label: "Uploader: user1", type: "uploader" },
      { id: "status-Done", label: "Status: Done", type: "status" },
    ];

    render(
      <FilterChips filters={filters} onRemoveFilter={mockOnRemoveFilter} />,
    );

    const removeButton = screen.getByTestId(
      "filter-chips-remove-uploader-user1",
    );
    fireEvent.click(removeButton);

    expect(mockOnRemoveFilter).toHaveBeenCalledWith("uploader-user1");
    expect(mockOnRemoveFilter).toHaveBeenCalledTimes(1);
  });

  it("should render multiple filter chips", () => {
    const filters: ActiveFilter[] = [
      { id: "uploader-user1", label: "Uploader: user1", type: "uploader" },
      { id: "uploader-user2", label: "Uploader: user2", type: "uploader" },
      { id: "status-Done", label: "Status: Done", type: "status" },
      {
        id: "date-2024-01-01-2024-01-31",
        label: "Jan 1, 2024 – Jan 31, 2024",
        type: "date",
      },
    ];

    render(<FilterChips filters={filters} />);
    expect(screen.getByText("Uploader: user1")).toBeInTheDocument();
    expect(screen.getByText("Uploader: user2")).toBeInTheDocument();
    expect(screen.getByText("Status: Done")).toBeInTheDocument();
    expect(screen.getByText("Jan 1, 2024 – Jan 31, 2024")).toBeInTheDocument();
  });

  it("should use custom testId", () => {
    const filters: ActiveFilter[] = [
      { id: "uploader-user1", label: "Uploader: user1", type: "uploader" },
    ];

    render(
      <FilterChips
        filters={filters}
        testId="custom-test-id"
        onRemoveFilter={mockOnRemoveFilter}
      />,
    );
    expect(screen.getByTestId("custom-test-id")).toBeInTheDocument();
    expect(
      screen.getByTestId("custom-test-id-chip-uploader-user1"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("custom-test-id-remove-uploader-user1"),
    ).toBeInTheDocument();
  });
});
