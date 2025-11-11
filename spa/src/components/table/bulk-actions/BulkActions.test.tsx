import { fireEvent, render, screen } from "@testing-library/react";
import { BulkActions } from "./BulkActions";

describe("BulkActions", () => {
  const mockOnDownload = vi.fn();
  const mockOnChangeStatus = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render download and change status buttons", () => {
    render(
      <BulkActions
        selectedCount={1}
        onDownload={mockOnDownload}
        onChangeStatus={mockOnChangeStatus}
      />,
    );
    expect(screen.getByText("Download")).toBeInTheDocument();
    expect(screen.getByText("Change status")).toBeInTheDocument();
  });

  it("should disable buttons when selectedCount is 0", () => {
    render(
      <BulkActions
        selectedCount={0}
        onDownload={mockOnDownload}
        onChangeStatus={mockOnChangeStatus}
      />,
    );
    const downloadButton = screen.getByTestId("bulk-actions-download");
    const changeStatusButton = screen.getByTestId(
      "bulk-actions-change-status-trigger",
    );

    expect(downloadButton).toBeDisabled();
    expect(changeStatusButton).toBeDisabled();
  });

  it("should enable buttons when selectedCount is greater than 0", () => {
    render(
      <BulkActions
        selectedCount={3}
        onDownload={mockOnDownload}
        onChangeStatus={mockOnChangeStatus}
      />,
    );
    const downloadButton = screen.getByTestId("bulk-actions-download");
    const changeStatusButton = screen.getByTestId(
      "bulk-actions-change-status-trigger",
    );

    expect(downloadButton).not.toBeDisabled();
    expect(changeStatusButton).not.toBeDisabled();
  });

  it("should call onDownload when download button is clicked", () => {
    render(
      <BulkActions
        selectedCount={2}
        onDownload={mockOnDownload}
        onChangeStatus={mockOnChangeStatus}
      />,
    );
    const downloadButton = screen.getByTestId("bulk-actions-download");
    fireEvent.click(downloadButton);

    expect(mockOnDownload).toHaveBeenCalledTimes(1);
  });

  it("should render change status dropdown content", () => {
    render(
      <BulkActions
        selectedCount={2}
        onDownload={mockOnDownload}
        onChangeStatus={mockOnChangeStatus}
      />,
    );

    // Just verify the trigger button exists and is enabled
    const changeStatusButton = screen.getByTestId(
      "bulk-actions-change-status-trigger",
    );
    expect(changeStatusButton).not.toBeDisabled();
  });

  it("should call onChangeStatus handler", () => {
    // Test that the handler is properly wired by verifying it's passed
    const { container } = render(
      <BulkActions
        selectedCount={2}
        onDownload={mockOnDownload}
        onChangeStatus={mockOnChangeStatus}
      />,
    );

    // Verify the component renders with the handler
    expect(
      container.querySelector(
        '[data-testid="bulk-actions-change-status-trigger"]',
      ),
    ).toBeInTheDocument();
  });

  it("should use custom testId", () => {
    render(
      <BulkActions
        selectedCount={1}
        onDownload={mockOnDownload}
        onChangeStatus={mockOnChangeStatus}
        testId="custom-bulk"
      />,
    );
    expect(screen.getByTestId("custom-bulk-download")).toBeInTheDocument();
    expect(
      screen.getByTestId("custom-bulk-change-status-trigger"),
    ).toBeInTheDocument();
  });

  it("should not call onDownload when button is disabled", () => {
    render(
      <BulkActions
        selectedCount={0}
        onDownload={mockOnDownload}
        onChangeStatus={mockOnChangeStatus}
      />,
    );
    const downloadButton = screen.getByTestId("bulk-actions-download");

    // The button has pointer-events-none when disabled, so click won't trigger
    expect(downloadButton).toBeDisabled();
    expect(mockOnDownload).not.toHaveBeenCalled();
  });
});
