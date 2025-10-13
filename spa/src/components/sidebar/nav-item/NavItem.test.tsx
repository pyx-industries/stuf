import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NavItem } from "./NavItem";

describe("NavItem", () => {
  it("renders the component", () => {
    render(<NavItem label="Configuration" icon="/icons/settings.svg" />);

    expect(screen.getByTestId("nav-item-configuration")).toBeInTheDocument();
  });

  it("renders label text", () => {
    render(<NavItem label="Configuration" icon="/icons/settings.svg" />);

    expect(screen.getByText("Configuration")).toBeInTheDocument();
  });

  it("renders icon", () => {
    const { container } = render(
      <NavItem label="Configuration" icon="/icons/settings.svg" />,
    );

    const icon = container.querySelector('img[src="/icons/settings.svg"]');
    expect(icon).toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <NavItem
        label="Configuration"
        icon="/icons/settings.svg"
        onClick={handleClick}
      />,
    );

    const navItem = screen.getByTestId("nav-item-configuration");
    await user.click(navItem);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("applies hover styles", () => {
    render(<NavItem label="Configuration" icon="/icons/settings.svg" />);

    const navItem = screen.getByTestId("nav-item-configuration");
    expect(navItem).toHaveClass("hover:bg-black/10");
    expect(navItem).toHaveClass("dark:hover:bg-white/10");
  });

  it("has cursor-pointer class", () => {
    render(<NavItem label="Configuration" icon="/icons/settings.svg" />);

    const navItem = screen.getByTestId("nav-item-configuration");
    expect(navItem).toHaveClass("cursor-pointer");
  });

  it("renders with custom className", () => {
    render(
      <NavItem
        label="Configuration"
        icon="/icons/settings.svg"
        className="custom-class"
      />,
    );

    const navItem = screen.getByTestId("nav-item-configuration");
    expect(navItem).toHaveClass("custom-class");
  });

  it("generates correct test id from label with spaces", () => {
    render(<NavItem label="My Settings" icon="/icons/settings.svg" />);

    expect(screen.getByTestId("nav-item-my-settings")).toBeInTheDocument();
  });
});
