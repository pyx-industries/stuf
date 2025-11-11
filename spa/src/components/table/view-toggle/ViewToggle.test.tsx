import { fireEvent, render, screen } from "@testing-library/react";
import { ViewToggle } from "./ViewToggle";

describe("ViewToggle", () => {
  const mockOnViewModeChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render list and grid buttons", () => {
    render(<ViewToggle viewMode="list" />);
    expect(screen.getByTestId("view-toggle")).toBeInTheDocument();
    expect(screen.getByTestId("view-toggle-list")).toBeInTheDocument();
    expect(screen.getByTestId("view-toggle-grid")).toBeInTheDocument();
  });

  it("should highlight list button when viewMode is list", () => {
    render(<ViewToggle viewMode="list" />);
    const listButton = screen.getByTestId("view-toggle-list");
    const gridButton = screen.getByTestId("view-toggle-grid");

    expect(listButton.className).toContain("shadow-");
    expect(gridButton.className).toContain("hover:bg-white/50");
  });

  it("should highlight grid button when viewMode is grid", () => {
    render(<ViewToggle viewMode="grid" />);
    const listButton = screen.getByTestId("view-toggle-list");
    const gridButton = screen.getByTestId("view-toggle-grid");

    expect(gridButton.className).toContain("shadow-");
    expect(listButton.className).toContain("hover:bg-white/50");
  });

  it("should call onViewModeChange with list when list button is clicked", () => {
    render(
      <ViewToggle viewMode="grid" onViewModeChange={mockOnViewModeChange} />,
    );
    const listButton = screen.getByTestId("view-toggle-list");
    fireEvent.click(listButton);

    expect(mockOnViewModeChange).toHaveBeenCalledWith("list");
  });

  it("should call onViewModeChange with grid when grid button is clicked", () => {
    render(
      <ViewToggle viewMode="list" onViewModeChange={mockOnViewModeChange} />,
    );
    const gridButton = screen.getByTestId("view-toggle-grid");
    fireEvent.click(gridButton);

    expect(mockOnViewModeChange).toHaveBeenCalledWith("grid");
  });

  it("should not error when onViewModeChange is not provided", () => {
    render(<ViewToggle viewMode="list" />);
    const gridButton = screen.getByTestId("view-toggle-grid");

    expect(() => fireEvent.click(gridButton)).not.toThrow();
  });

  it("should use custom testId", () => {
    render(
      <ViewToggle
        viewMode="list"
        onViewModeChange={mockOnViewModeChange}
        testId="custom-toggle"
      />,
    );
    expect(screen.getByTestId("custom-toggle")).toBeInTheDocument();
    expect(screen.getByTestId("custom-toggle-list")).toBeInTheDocument();
    expect(screen.getByTestId("custom-toggle-grid")).toBeInTheDocument();
  });
});
