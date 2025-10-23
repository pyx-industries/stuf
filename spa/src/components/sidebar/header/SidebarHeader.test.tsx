import { render, screen } from "@testing-library/react";
import { SidebarHeader } from "./SidebarHeader";

describe("SidebarHeader", () => {
  it("renders the component", () => {
    render(<SidebarHeader />);

    expect(screen.getByTestId("sidebar-header")).toBeInTheDocument();
  });

  it("renders STUF text", () => {
    render(<SidebarHeader />);

    expect(screen.getByText("STUF")).toBeInTheDocument();
  });

  it("renders with custom className", () => {
    render(<SidebarHeader className="custom-class" />);

    const header = screen.getByTestId("sidebar-header");
    expect(header).toHaveClass("custom-class");
  });
});
