import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CollectionItem } from "./CollectionItem";

describe("CollectionItem", () => {
  it("renders collection name", () => {
    render(<CollectionItem id="collection-a" name="Collections A" />);

    expect(screen.getByText("Collections A")).toBeInTheDocument();
  });

  it("generates test ID from collection id", () => {
    render(<CollectionItem id="collection-a" name="Collections A" />);

    expect(
      screen.getByTestId("collection-item-collection-a"),
    ).toBeInTheDocument();
  });

  it("generates test ID with spaces converted to dashes", () => {
    render(<CollectionItem id="My Collection" name="My Collection" />);

    expect(
      screen.getByTestId("collection-item-my-collection"),
    ).toBeInTheDocument();
  });

  it("renders closed folder icon when not selected", () => {
    const { container } = render(
      <CollectionItem id="collection-a" name="Collections A" />,
    );

    const icon = container.querySelector("img");
    expect(icon).toHaveAttribute("src", "/icons/folder.svg");
  });

  it("renders open folder icon when selected", () => {
    const { container } = render(
      <CollectionItem id="collection-a" name="Collections A" isSelected />,
    );

    const icon = container.querySelector("img");
    expect(icon).toHaveAttribute("src", "/icons/folder_open.svg");
  });

  it("applies primary background when selected", () => {
    render(
      <CollectionItem id="collection-a" name="Collections A" isSelected />,
    );

    const button = screen.getByTestId("collection-item-collection-a");
    expect(button).toHaveClass("bg-primary");
  });

  it("does not apply primary background when not selected", () => {
    render(<CollectionItem id="collection-a" name="Collections A" />);

    const button = screen.getByTestId("collection-item-collection-a");
    expect(button).not.toHaveClass("bg-primary");
  });

  it("applies text-black class when selected", () => {
    render(
      <CollectionItem id="collection-a" name="Collections A" isSelected />,
    );

    const text = screen.getByText("Collections A");
    expect(text).toHaveClass("text-black");
  });

  it("applies text-foreground class when not selected", () => {
    render(<CollectionItem id="collection-a" name="Collections A" />);

    const text = screen.getByText("Collections A");
    expect(text).toHaveClass("text-foreground");
  });

  it("calls onClick handler when clicked", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <CollectionItem
        id="collection-a"
        name="Collections A"
        onClick={handleClick}
      />,
    );

    const button = screen.getByTestId("collection-item-collection-a");
    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("renders with custom className", () => {
    render(
      <CollectionItem
        id="collection-a"
        name="Collections A"
        className="custom-class"
      />,
    );

    const button = screen.getByTestId("collection-item-collection-a");
    expect(button).toHaveClass("custom-class");
  });

  it("has cursor-pointer class", () => {
    render(<CollectionItem id="collection-a" name="Collections A" />);

    const button = screen.getByTestId("collection-item-collection-a");
    expect(button).toHaveClass("cursor-pointer");
  });

  it("applies truncate class to text", () => {
    render(<CollectionItem id="collection-a" name="Collections A" />);

    const text = screen.getByText("Collections A");
    expect(text).toHaveClass("truncate");
  });

  it("renders long collection names with truncate", () => {
    render(
      <CollectionItem
        id="very-long-collection"
        name="Very Long Collection Name That Should Truncate Properly When It Exceeds The Container Width"
      />,
    );

    const text = screen.getByText(
      "Very Long Collection Name That Should Truncate Properly When It Exceeds The Container Width",
    );
    expect(text).toHaveClass("truncate");
  });

  it("renders multiple items with unique test IDs", () => {
    render(
      <>
        <CollectionItem id="collection-a" name="Collections A" />
        <CollectionItem id="collection-b" name="Collections B" />
        <CollectionItem id="collection-c" name="Collections C" />
      </>,
    );

    expect(
      screen.getByTestId("collection-item-collection-a"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("collection-item-collection-b"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("collection-item-collection-c"),
    ).toBeInTheDocument();
  });

  it("only one item has selected state when multiple rendered", () => {
    render(
      <>
        <CollectionItem id="collection-a" name="Collections A" isSelected />
        <CollectionItem id="collection-b" name="Collections B" />
        <CollectionItem id="collection-c" name="Collections C" />
      </>,
    );

    const buttonA = screen.getByTestId("collection-item-collection-a");
    const buttonB = screen.getByTestId("collection-item-collection-b");
    const buttonC = screen.getByTestId("collection-item-collection-c");

    expect(buttonA).toHaveClass("bg-primary");
    expect(buttonB).not.toHaveClass("bg-primary");
    expect(buttonC).not.toHaveClass("bg-primary");
  });
});
