import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CollectionsGrid } from "./CollectionsGrid";

describe("CollectionsGrid", () => {
  const mockCollections = [
    { id: "collection-a", name: "Collection A", fileCount: 122 },
    { id: "collection-b", name: "Collection B", fileCount: 45 },
    { id: "collection-c", name: "Collection C", fileCount: 78 },
  ];

  const defaultProps = {
    collections: mockCollections,
    onCollectionClick: vi.fn(),
    onCollectionSettings: vi.fn(),
    onCreateCollection: vi.fn(),
  };

  it("renders all collections", () => {
    render(<CollectionsGrid {...defaultProps} />);

    expect(screen.getByTestId("collections-grid")).toBeInTheDocument();
    expect(
      screen.getByTestId("collection-card-collection-a"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("collection-card-collection-b"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("collection-card-collection-c"),
    ).toBeInTheDocument();
  });

  it("renders create collection card", () => {
    render(<CollectionsGrid {...defaultProps} />);

    expect(screen.getByTestId("create-collection-card")).toBeInTheDocument();
  });

  it("calls onCollectionClick when collection is clicked", async () => {
    const user = userEvent.setup();
    render(<CollectionsGrid {...defaultProps} />);

    const viewButton = screen.getByTestId("view-button-collection-a");
    await user.click(viewButton);

    expect(defaultProps.onCollectionClick).toHaveBeenCalledWith("collection-a");
  });

  it("calls onCreateCollection when create card is clicked", async () => {
    const user = userEvent.setup();
    render(<CollectionsGrid {...defaultProps} />);

    const createButton = screen.getByTestId("create-collection-card");
    await user.click(createButton);

    expect(defaultProps.onCreateCollection).toHaveBeenCalled();
  });

  it("renders loading skeletons when loading", () => {
    render(<CollectionsGrid {...defaultProps} loading={true} />);

    expect(screen.getByTestId("collections-grid-loading")).toBeInTheDocument();
    expect(screen.getByTestId("collection-skeleton-1")).toBeInTheDocument();
    expect(screen.getByTestId("collection-skeleton-2")).toBeInTheDocument();
    expect(screen.getByTestId("collection-skeleton-3")).toBeInTheDocument();
    expect(screen.getByTestId("collection-skeleton-4")).toBeInTheDocument();
    expect(screen.getByTestId("collection-skeleton-5")).toBeInTheDocument();

    // Collections should not be visible when loading
    expect(
      screen.queryByTestId("collection-card-collection-a"),
    ).not.toBeInTheDocument();
  });

  it("hides create collection card when showCreateCollection is false", () => {
    render(<CollectionsGrid {...defaultProps} showCreateCollection={false} />);

    expect(
      screen.queryByTestId("create-collection-card"),
    ).not.toBeInTheDocument();
  });
});
