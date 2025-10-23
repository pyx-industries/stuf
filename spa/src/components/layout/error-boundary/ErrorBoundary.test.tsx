import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorBoundary } from "./ErrorBoundary";

// Helper component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error("Test error");
  }
  return <div>Normal content</div>;
};

describe("ErrorBoundary", () => {
  // Suppress console.error during error tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = vi.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders children when there is no error", () => {
    render(
      <ErrorBoundary>
        <div data-testid="child-content">Test content</div>
      </ErrorBoundary>,
    );

    expect(screen.getByTestId("child-content")).toBeInTheDocument();
    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("renders multiple children when there is no error", () => {
    render(
      <ErrorBoundary>
        <div data-testid="child-1">First child</div>
        <div data-testid="child-2">Second child</div>
      </ErrorBoundary>,
    );

    expect(screen.getByTestId("child-1")).toBeInTheDocument();
    expect(screen.getByTestId("child-2")).toBeInTheDocument();
  });

  it("renders error UI when an error occurs", () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(
      screen.getByText(
        /We're sorry, but an unexpected error occurred. Please try reloading the page./,
      ),
    ).toBeInTheDocument();
  });

  it("renders reload button in error state", () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    const reloadButton = screen.getByRole("button", { name: /reload page/i });
    expect(reloadButton).toBeInTheDocument();
  });

  it("calls window.location.reload when reload button is clicked", async () => {
    const user = userEvent.setup();

    // Mock window.location.reload
    const originalLocation = window.location;
    const reloadMock = vi.fn();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).location;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).location = { ...originalLocation, reload: reloadMock };

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    const reloadButton = screen.getByRole("button", { name: /reload page/i });
    await user.click(reloadButton);

    expect(reloadMock).toHaveBeenCalledTimes(1);

    // Cleanup
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).location = originalLocation;
  });

  it("logs error to console when componentDidCatch is called", () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(console.error).toHaveBeenCalled();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const errorCall = (console.error as any).mock.calls.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (call: any[]) => call[0] === "Uncaught error:",
    );
    expect(errorCall).toBeDefined();
  });

  it("does not render children when in error state", () => {
    render(
      <ErrorBoundary>
        <div data-testid="child-content">Should not appear</div>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.queryByTestId("child-content")).not.toBeInTheDocument();
    expect(screen.queryByText("Should not appear")).not.toBeInTheDocument();
  });
});
