import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { ConfirmDialog } from "./ConfirmDialog";

describe("ConfirmDialog", () => {
  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with title and description", () => {
    render(
      <ConfirmDialog
        open={true}
        title="Delete file"
        description="Are you sure you want to delete this file?"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />,
    );

    expect(screen.getByTestId("confirm-dialog-title")).toHaveTextContent(
      "Delete file",
    );
    expect(screen.getByTestId("confirm-dialog-description")).toHaveTextContent(
      "Are you sure you want to delete this file?",
    );
  });

  it("renders with custom button text", () => {
    render(
      <ConfirmDialog
        open={true}
        title="Delete file"
        description="Are you sure?"
        confirmText="Delete"
        cancelText="Go back"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />,
    );

    expect(screen.getByTestId("confirm-dialog-confirm")).toHaveTextContent(
      "Delete",
    );
    expect(screen.getByTestId("confirm-dialog-cancel")).toHaveTextContent(
      "Go back",
    );
  });

  it("calls onConfirm when confirm button is clicked", () => {
    render(
      <ConfirmDialog
        open={true}
        title="Delete file"
        description="Are you sure?"
        confirmText="Delete"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />,
    );

    fireEvent.click(screen.getByTestId("confirm-dialog-confirm"));
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when cancel button is clicked", () => {
    render(
      <ConfirmDialog
        open={true}
        title="Delete file"
        description="Are you sure?"
        cancelText="Cancel"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />,
    );

    fireEvent.click(screen.getByTestId("confirm-dialog-cancel"));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it("renders danger alert when provided", () => {
    render(
      <ConfirmDialog
        open={true}
        title="Delete collection"
        description="This will permanently delete the collection."
        dangerAlert={{
          message:
            "All files will be deleted immediately and can't be retrieved.",
        }}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />,
    );

    expect(screen.getByTestId("confirm-dialog-danger-alert")).toHaveTextContent(
      "All files will be deleted immediately and can't be retrieved.",
    );
  });

  it("renders custom children", () => {
    render(
      <ConfirmDialog
        open={true}
        title="Delete collection"
        description="Are you sure you want to proceed?"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      >
        <div>Custom content here</div>
      </ConfirmDialog>,
    );

    expect(screen.getByTestId("confirm-dialog-children")).toHaveTextContent(
      "Custom content here",
    );
  });

  it("renders without description", () => {
    render(
      <ConfirmDialog
        open={true}
        title="Delete collection"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />,
    );

    expect(screen.getByTestId("confirm-dialog-title")).toHaveTextContent(
      "Delete collection",
    );
    expect(
      screen.queryByTestId("confirm-dialog-description"),
    ).not.toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(
      <ConfirmDialog
        open={false}
        title="Delete file"
        description="Are you sure?"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />,
    );

    expect(screen.queryByTestId("confirm-dialog")).not.toBeInTheDocument();
  });

  it("disables buttons when loading", () => {
    render(
      <ConfirmDialog
        open={true}
        title="Processing"
        description="Please wait while we process your request."
        isLoading={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />,
    );

    expect(screen.getByTestId("confirm-dialog-confirm")).toBeDisabled();
    expect(screen.getByTestId("confirm-dialog-cancel")).toBeDisabled();
  });

  it("displays loading text when loading", () => {
    render(
      <ConfirmDialog
        open={true}
        title="Processing"
        description="Please wait while we process your request."
        confirmText="Submit"
        isLoading={true}
        loadingText="Submitting..."
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />,
    );

    expect(screen.getByTestId("confirm-dialog-confirm")).toHaveTextContent(
      "Submitting...",
    );
  });

  it("displays default confirm text when not loading", () => {
    render(
      <ConfirmDialog
        open={true}
        title="Processing"
        description="Please confirm your submission."
        confirmText="Submit"
        isLoading={false}
        loadingText="Submitting..."
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />,
    );

    expect(screen.getByTestId("confirm-dialog-confirm")).toHaveTextContent(
      "Submit",
    );
  });
});
