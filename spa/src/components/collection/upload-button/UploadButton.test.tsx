import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UploadButton } from "./UploadButton";

describe("UploadButton", () => {
  it("renders correctly", () => {
    render(<UploadButton />);

    expect(screen.getByTestId("upload-button")).toBeInTheDocument();
    expect(screen.getByText("Add files")).toBeInTheDocument();
  });

  it("renders the upload icon", () => {
    render(<UploadButton />);

    const uploadIcon = screen.getByAltText("Upload");

    expect(uploadIcon).toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<UploadButton onClick={handleClick} />);

    const button = screen.getByTestId("upload-button");
    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("applies custom className", () => {
    render(<UploadButton className="custom-class" />);

    const button = screen.getByTestId("upload-button");
    expect(button).toHaveClass("custom-class");
  });

  it("has cursor-pointer class", () => {
    render(<UploadButton />);

    const button = screen.getByTestId("upload-button");
    expect(button).toHaveClass("cursor-pointer");
  });

  it("has accessible aria-label", () => {
    render(<UploadButton />);

    expect(screen.getByLabelText("Add files")).toBeInTheDocument();
  });
});
