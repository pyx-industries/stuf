import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CollectionNav } from "./CollectionNav";
import type { Collection } from "@/types";

const mockCollections: Collection[] = [
  { id: "collection-a", name: "Collections A" },
  { id: "collection-b", name: "Collections B" },
  { id: "collection-c", name: "Collections C" },
];

describe("CollectionNav", () => {
  it("renders the component", () => {
    render(<CollectionNav collections={mockCollections} />);

    expect(screen.getByTestId("collection-nav")).toBeInTheDocument();
  });

  it("renders Files home button", () => {
    render(<CollectionNav collections={mockCollections} />);

    expect(screen.getByTestId("collection-nav-home")).toBeInTheDocument();
    expect(screen.getByText("Files home")).toBeInTheDocument();
  });

  it("renders all collections", () => {
    render(<CollectionNav collections={mockCollections} />);

    expect(screen.getByText("Collections A")).toBeInTheDocument();
    expect(screen.getByText("Collections B")).toBeInTheDocument();
    expect(screen.getByText("Collections C")).toBeInTheDocument();
  });

  it("renders toggle button", () => {
    render(<CollectionNav collections={mockCollections} />);

    expect(screen.getByTestId("collection-nav-toggle")).toBeInTheDocument();
  });

  it("calls onHomeClick when Files home is clicked", async () => {
    const user = userEvent.setup();
    const handleHomeClick = vi.fn();

    render(
      <CollectionNav
        collections={mockCollections}
        onHomeClick={handleHomeClick}
      />,
    );

    const homeButton = screen.getByTestId("collection-nav-home");
    await user.click(homeButton);

    expect(handleHomeClick).toHaveBeenCalledTimes(1);
  });

  it("calls onCollectionSelect with correct id when collection is clicked", async () => {
    const user = userEvent.setup();
    const handleCollectionSelect = vi.fn();

    render(
      <CollectionNav
        collections={mockCollections}
        onCollectionSelect={handleCollectionSelect}
      />,
    );

    const collectionButton = screen.getByTestId("collection-item-collection-b");
    await user.click(collectionButton);

    expect(handleCollectionSelect).toHaveBeenCalledTimes(1);
    expect(handleCollectionSelect).toHaveBeenCalledWith("collection-b");
  });

  it("shows selected state on Files home when isHomeSelected is true", () => {
    render(
      <CollectionNav collections={mockCollections} isHomeSelected={true} />,
    );

    const homeButton = screen.getByTestId("collection-nav-home");
    expect(homeButton).toHaveAttribute("aria-pressed", "true");
  });

  it("shows selected state on collection when selectedCollectionId matches", () => {
    render(
      <CollectionNav
        collections={mockCollections}
        selectedCollectionId="collection-b"
      />,
    );

    const collectionButton = screen.getByTestId("collection-item-collection-b");
    expect(collectionButton).toHaveAttribute("aria-pressed", "true");
    expect(collectionButton).toHaveClass("bg-primary");
  });

  it("collections are expanded by default", () => {
    render(<CollectionNav collections={mockCollections} />);

    expect(screen.getByText("Collections A")).toBeVisible();
    expect(screen.getByText("Collections B")).toBeVisible();
    expect(screen.getByText("Collections C")).toBeVisible();
  });

  it("collapses collections when toggle is clicked (uncontrolled)", async () => {
    const user = userEvent.setup();

    render(<CollectionNav collections={mockCollections} />);

    const toggleButton = screen.getByTestId("collection-nav-toggle");
    await user.click(toggleButton);

    expect(screen.queryByText("Collections A")).not.toBeInTheDocument();
    expect(screen.queryByText("Collections B")).not.toBeInTheDocument();
    expect(screen.queryByText("Collections C")).not.toBeInTheDocument();
  });

  it("expands collections when toggle is clicked again (uncontrolled)", async () => {
    const user = userEvent.setup();

    render(<CollectionNav collections={mockCollections} />);

    const toggleButton = screen.getByTestId("collection-nav-toggle");

    // Collapse
    await user.click(toggleButton);
    expect(screen.queryByText("Collections A")).not.toBeInTheDocument();

    // Expand
    await user.click(toggleButton);
    expect(screen.getByText("Collections A")).toBeInTheDocument();
    expect(screen.getByText("Collections B")).toBeInTheDocument();
    expect(screen.getByText("Collections C")).toBeInTheDocument();
  });

  it("respects controlled isExpanded prop", () => {
    render(<CollectionNav collections={mockCollections} isExpanded={false} />);

    expect(screen.queryByText("Collections A")).not.toBeInTheDocument();
    expect(screen.queryByText("Collections B")).not.toBeInTheDocument();
    expect(screen.queryByText("Collections C")).not.toBeInTheDocument();
  });

  it("calls onToggleExpanded when toggle is clicked (controlled)", async () => {
    const user = userEvent.setup();
    const handleToggleExpanded = vi.fn();

    render(
      <CollectionNav
        collections={mockCollections}
        isExpanded={true}
        onToggleExpanded={handleToggleExpanded}
      />,
    );

    const toggleButton = screen.getByTestId("collection-nav-toggle");
    await user.click(toggleButton);

    expect(handleToggleExpanded).toHaveBeenCalledTimes(1);
  });

  it("renders with custom className", () => {
    render(
      <CollectionNav collections={mockCollections} className="custom-class" />,
    );

    const nav = screen.getByTestId("collection-nav");
    expect(nav).toHaveClass("custom-class");
  });

  it("renders with empty collections array", () => {
    render(<CollectionNav collections={[]} />);

    expect(screen.getByTestId("collection-nav")).toBeInTheDocument();
    expect(screen.getByText("Files home")).toBeInTheDocument();
    expect(screen.queryByText("Collections")).not.toBeInTheDocument();
  });

  it("Files home button has cursor-pointer class", () => {
    render(<CollectionNav collections={mockCollections} />);

    const homeButton = screen.getByTestId("collection-nav-home");
    expect(homeButton).toHaveClass("cursor-pointer");
  });

  it("toggle button has cursor-pointer class", () => {
    render(<CollectionNav collections={mockCollections} />);

    const toggleButton = screen.getByTestId("collection-nav-toggle");
    expect(toggleButton).toHaveClass("cursor-pointer");
  });

  it("Files home icon is visible", () => {
    const { container } = render(
      <CollectionNav collections={mockCollections} />,
    );

    const homeIcon = container.querySelector(
      'img[src*="contextual_token.svg"]',
    );
    expect(homeIcon).toBeInTheDocument();
  });

  it("toggle icon is visible", () => {
    const { container } = render(
      <CollectionNav collections={mockCollections} />,
    );

    const toggleIcon = container.querySelector(
      'img[src*="keyboard_arrow_up.svg"]',
    );
    expect(toggleIcon).toBeInTheDocument();
  });

  it("toggle icon rotates when collapsed", () => {
    const { rerender, container } = render(
      <CollectionNav collections={mockCollections} isExpanded={true} />,
    );

    let toggleIcon = container.querySelector(
      'img[src*="keyboard_arrow_up.svg"]',
    );
    expect(toggleIcon).not.toHaveClass("rotate-180");

    rerender(
      <CollectionNav collections={mockCollections} isExpanded={false} />,
    );

    toggleIcon = container.querySelector('img[src*="keyboard_arrow_up.svg"]');
    expect(toggleIcon).toHaveClass("rotate-180");
  });

  it("collections have left padding when expanded", () => {
    render(<CollectionNav collections={mockCollections} isExpanded={true} />);

    const collectionsContainer = screen
      .getByText("Collections A")
      .closest(".pl-9");
    expect(collectionsContainer).toBeInTheDocument();
  });

  it("does not render collections container when collapsed", () => {
    render(<CollectionNav collections={mockCollections} isExpanded={false} />);

    const nav = screen.getByTestId("collection-nav");
    const collectionsContainer = nav.querySelector(".pl-9");
    expect(collectionsContainer).not.toBeInTheDocument();
  });

  it("only one collection can be selected at a time", () => {
    render(
      <CollectionNav
        collections={mockCollections}
        selectedCollectionId="collection-b"
      />,
    );

    const collectionA = screen.getByTestId("collection-item-collection-a");
    const collectionB = screen.getByTestId("collection-item-collection-b");
    const collectionC = screen.getByTestId("collection-item-collection-c");

    expect(collectionA).not.toHaveClass("bg-primary");
    expect(collectionB).toHaveClass("bg-primary");
    expect(collectionC).not.toHaveClass("bg-primary");
  });

  it("renders many collections", () => {
    const manyCollections: Collection[] = Array.from(
      { length: 20 },
      (_, i) => ({
        id: `collection-${i}`,
        name: `Collection ${i}`,
      }),
    );

    render(<CollectionNav collections={manyCollections} />);

    expect(screen.getByText("Collection 0")).toBeInTheDocument();
    expect(screen.getByText("Collection 10")).toBeInTheDocument();
    expect(screen.getByText("Collection 19")).toBeInTheDocument();
  });

  it("applies scrollable styles with many collections", () => {
    const manyCollections: Collection[] = Array.from(
      { length: 20 },
      (_, i) => ({
        id: `collection-${i}`,
        name: `Collection ${i}`,
      }),
    );

    render(<CollectionNav collections={manyCollections} />);

    // Find the collections container
    const collectionsContainer = screen
      .getByText("Collection 0")
      .closest(".pl-9");

    expect(collectionsContainer).toHaveClass("max-h-64");
    expect(collectionsContainer).toHaveClass("overflow-y-auto");
  });

  it("assigns ref to selected collection item", () => {
    const manyCollections: Collection[] = Array.from(
      { length: 20 },
      (_, i) => ({
        id: `collection-${i}`,
        name: `Collection ${i}`,
      }),
    );

    render(
      <CollectionNav
        collections={manyCollections}
        selectedCollectionId="collection-10"
      />,
    );

    // Verify selected collection is rendered
    const selectedItem = screen.getByTestId("collection-item-collection-10");
    expect(selectedItem).toBeInTheDocument();
    expect(selectedItem).toHaveClass("bg-primary");
  });
});
