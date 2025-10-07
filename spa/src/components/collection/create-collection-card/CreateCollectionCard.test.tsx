import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreateCollectionCard } from "./CreateCollectionCard";

describe("CreateCollectionCard", () => {
  it("renders correctly", () => {
    render(<CreateCollectionCard />);

    expect(screen.getByTestId("create-collection-card")).toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<CreateCollectionCard onClick={handleClick} />);

    const card = screen.getByTestId("create-collection-card");
    await user.click(card);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("applies custom className", () => {
    render(<CreateCollectionCard className="custom-class" />);

    const card = screen.getByTestId("create-collection-card");
    expect(card).toHaveClass("custom-class");
  });

  it("has cursor-pointer class", () => {
    render(<CreateCollectionCard />);

    const card = screen.getByTestId("create-collection-card");
    expect(card).toHaveClass("cursor-pointer");
  });

  it("has accessible aria-label", () => {
    render(<CreateCollectionCard />);

    expect(screen.getByLabelText("Create new collection")).toBeInTheDocument();
  });
});
