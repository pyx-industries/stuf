import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CollectionCard } from "./CollectionCard";

describe("CollectionCard", () => {
  it("renders collection name and file count", () => {
    render(<CollectionCard name="Test Collection" fileCount={42} />);

    expect(
      screen.getByTestId("collection-name-test-collection"),
    ).toHaveTextContent("Test Collection");
    expect(screen.getByTestId("file-count-test-collection")).toHaveTextContent(
      "42",
    );
  });

  it("renders with zero files", () => {
    render(<CollectionCard name="Empty Collection" fileCount={0} />);

    expect(
      screen.getByTestId("collection-name-empty-collection"),
    ).toHaveTextContent("Empty Collection");
    expect(screen.getByTestId("file-count-empty-collection")).toHaveTextContent(
      "0",
    );
  });

  it("renders with large file count", () => {
    render(<CollectionCard name="Large Collection" fileCount={9999} />);

    expect(screen.getByTestId("file-count-large-collection")).toHaveTextContent(
      "9999",
    );
  });

  it("calls onSettingsClick when settings button is clicked", async () => {
    const user = userEvent.setup();
    const handleSettingsClick = vi.fn();

    render(
      <CollectionCard
        name="Test Collection"
        fileCount={10}
        onSettingsClick={handleSettingsClick}
      />,
    );

    const settingsButton = screen.getByTestId(
      "settings-button-test-collection",
    );
    await user.click(settingsButton);

    expect(handleSettingsClick).toHaveBeenCalledTimes(1);
  });

  it("calls onViewClick when arrow button is clicked", async () => {
    const user = userEvent.setup();
    const handleViewClick = vi.fn();

    render(
      <CollectionCard
        name="Test Collection"
        fileCount={10}
        onViewClick={handleViewClick}
      />,
    );

    const viewButton = screen.getByTestId("view-button-test-collection");
    await user.click(viewButton);

    expect(handleViewClick).toHaveBeenCalledTimes(1);
  });

  it("renders with custom className", () => {
    render(
      <CollectionCard
        name="Test Collection"
        fileCount={10}
        className="custom-class"
      />,
    );

    const card = screen.getByTestId("collection-card-test-collection");
    expect(card).toHaveClass("custom-class");
  });

  it("renders all icon images", () => {
    render(<CollectionCard name="Test Collection" fileCount={10} />);

    const settingsIcon = screen.getByAltText("Settings");
    const filesIcon = screen.getByAltText("Files");
    const viewIcon = screen.getByAltText("View");

    expect(settingsIcon).toBeInTheDocument();
    expect(filesIcon).toBeInTheDocument();
    expect(viewIcon).toBeInTheDocument();
  });

  it("settings button has cursor pointer class", () => {
    render(<CollectionCard name="Test Collection" fileCount={10} />);

    const settingsButton = screen.getByTestId(
      "settings-button-test-collection",
    );
    expect(settingsButton).toHaveClass("cursor-pointer");
  });

  it("view button has cursor pointer class", () => {
    render(<CollectionCard name="Test Collection" fileCount={10} />);

    const viewButton = screen.getByTestId("view-button-test-collection");
    expect(viewButton).toHaveClass("cursor-pointer");
  });

  it("generates unique test IDs for multiple cards with same structure", () => {
    render(
      <>
        <CollectionCard name="Collection A" fileCount={100} />
        <CollectionCard name="Collection B" fileCount={200} />
      </>,
    );

    expect(
      screen.getByTestId("collection-card-collection-a"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("collection-card-collection-b"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("file-count-collection-a")).toHaveTextContent(
      "100",
    );
    expect(screen.getByTestId("file-count-collection-b")).toHaveTextContent(
      "200",
    );
  });

  it("has accessible aria-labels for buttons", () => {
    render(<CollectionCard name="My Collection" fileCount={5} />);

    expect(
      screen.getByLabelText("Settings for My Collection"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("View My Collection")).toBeInTheDocument();
  });
});
