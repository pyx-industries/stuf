import { fireEvent, render, screen } from "@testing-library/react";
import { FilterDropdown } from "./FilterDropdown";

describe("FilterDropdown", () => {
  const defaultProps = {
    isOpen: true,
    onOpenChange: vi.fn(),
    availableUploaders: ["user1@example.com", "user2@example.com"],
    selectedUploaders: [],
    onToggleUploader: vi.fn(),
    selectedStatuses: [],
    onToggleStatus: vi.fn(),
    dateRange: { start: "", end: "" },
    onDateRangeChange: vi.fn(),
    onApply: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render filter dropdown trigger", () => {
    render(<FilterDropdown {...defaultProps} isOpen={false} />);
    expect(screen.getByTestId("filter-dropdown-trigger")).toBeInTheDocument();
  });

  it("should render uploader section when uploaders are available", () => {
    render(<FilterDropdown {...defaultProps} />);
    expect(screen.getByText("Uploader")).toBeInTheDocument();
    expect(screen.getByText("user1@example.com")).toBeInTheDocument();
    expect(screen.getByText("user2@example.com")).toBeInTheDocument();
  });

  it("should not render uploader section when no uploaders available", () => {
    render(<FilterDropdown {...defaultProps} availableUploaders={[]} />);
    expect(screen.queryByText("Uploader")).not.toBeInTheDocument();
  });

  it("should render status section", () => {
    render(<FilterDropdown {...defaultProps} />);
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("In progress")).toBeInTheDocument();
    expect(screen.getByText("Review")).toBeInTheDocument();
    expect(screen.getByText("Done")).toBeInTheDocument();
  });

  it("should render date range section", () => {
    render(<FilterDropdown {...defaultProps} />);
    expect(screen.getByText("Date Range")).toBeInTheDocument();
    expect(screen.getByText("From")).toBeInTheDocument();
    expect(screen.getByText("To")).toBeInTheDocument();
  });

  it("should call onToggleUploader when uploader checkbox is clicked", () => {
    render(<FilterDropdown {...defaultProps} />);
    const uploaderCheckbox = screen
      .getByText("user1@example.com")
      .closest("label");
    if (uploaderCheckbox) {
      fireEvent.click(uploaderCheckbox);
    }
    expect(defaultProps.onToggleUploader).toHaveBeenCalledWith(
      "user1@example.com",
    );
  });

  it("should call onToggleStatus when status checkbox is clicked", () => {
    render(<FilterDropdown {...defaultProps} />);
    const statusCheckbox = screen.getByText("Done").closest("label");
    if (statusCheckbox) {
      fireEvent.click(statusCheckbox);
    }
    expect(defaultProps.onToggleStatus).toHaveBeenCalledWith("Done");
  });

  it("should call onDateRangeChange when date inputs change", () => {
    render(<FilterDropdown {...defaultProps} />);

    const startDateInput = screen.getByTestId("filter-dropdown-date-start");
    const endDateInput = screen.getByTestId("filter-dropdown-date-end");

    fireEvent.change(startDateInput, { target: { value: "2024-01-01" } });
    expect(defaultProps.onDateRangeChange).toHaveBeenCalledWith({
      start: "2024-01-01",
      end: "",
    });

    fireEvent.change(endDateInput, { target: { value: "2024-01-31" } });
    expect(defaultProps.onDateRangeChange).toHaveBeenCalledWith({
      start: "",
      end: "2024-01-31",
    });
  });

  it("should disable Apply button when no filters are selected", () => {
    render(<FilterDropdown {...defaultProps} />);
    const applyButton = screen.getByTestId("filter-dropdown-apply");
    expect(applyButton).toBeDisabled();
  });

  it("should enable Apply button when uploaders are selected", () => {
    render(
      <FilterDropdown
        {...defaultProps}
        selectedUploaders={["user1@example.com"]}
      />,
    );
    const applyButton = screen.getByTestId("filter-dropdown-apply");
    expect(applyButton).not.toBeDisabled();
  });

  it("should enable Apply button when statuses are selected", () => {
    render(<FilterDropdown {...defaultProps} selectedStatuses={["Done"]} />);
    const applyButton = screen.getByTestId("filter-dropdown-apply");
    expect(applyButton).not.toBeDisabled();
  });

  it("should enable Apply button when date range is complete", () => {
    render(
      <FilterDropdown
        {...defaultProps}
        dateRange={{ start: "2024-01-01", end: "2024-01-31" }}
      />,
    );
    const applyButton = screen.getByTestId("filter-dropdown-apply");
    expect(applyButton).not.toBeDisabled();
  });

  it("should call onApply when Apply button is clicked", () => {
    render(
      <FilterDropdown
        {...defaultProps}
        selectedUploaders={["user1@example.com"]}
      />,
    );
    const applyButton = screen.getByTestId("filter-dropdown-apply");
    fireEvent.click(applyButton);
    expect(defaultProps.onApply).toHaveBeenCalled();
  });

  it("should call onOpenChange when Cancel button is clicked", () => {
    render(<FilterDropdown {...defaultProps} />);
    const cancelButton = screen.getByTestId("filter-dropdown-cancel");
    fireEvent.click(cancelButton);
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it("should display checked state for selected uploaders", () => {
    render(
      <FilterDropdown
        {...defaultProps}
        selectedUploaders={["user1@example.com"]}
      />,
    );
    const checkbox = screen
      .getByText("user1@example.com")
      .closest("label")
      ?.querySelector('[type="button"]');
    expect(checkbox).toHaveAttribute("data-state", "checked");
  });

  it("should display checked state for selected statuses", () => {
    render(<FilterDropdown {...defaultProps} selectedStatuses={["Done"]} />);
    const checkbox = screen
      .getByText("Done")
      .closest("label")
      ?.querySelector('[type="button"]');
    expect(checkbox).toHaveAttribute("data-state", "checked");
  });
});
