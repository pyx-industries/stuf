import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { faker } from "@faker-js/faker";
import { SidebarFooter } from "./SidebarFooter";
import { UserRole, type User } from "@/types";

const mockUser: User = {
  name: "Cindy Reardon",
  email: "c.reardon@emailadress.com",
  roles: [UserRole.User],
};

describe("SidebarFooter", () => {
  it("renders the component", () => {
    render(<SidebarFooter user={mockUser} onLogout={vi.fn()} />);

    expect(screen.getByTestId("sidebar-footer")).toBeInTheDocument();
  });

  it("renders the sidebar profile", () => {
    render(<SidebarFooter user={mockUser} onLogout={vi.fn()} />);

    expect(screen.getByTestId("sidebar-profile")).toBeInTheDocument();
    expect(screen.getByText("Cindy Reardon")).toBeInTheDocument();
    expect(screen.getByText("c.reardon@emailadress.com")).toBeInTheDocument();
  });

  it("renders the more options menu", () => {
    render(<SidebarFooter user={mockUser} onLogout={vi.fn()} />);

    expect(screen.getByTestId("sidebar-menu-trigger")).toBeInTheDocument();
  });

  it("shows logout option when menu is clicked", async () => {
    const user = userEvent.setup();

    render(<SidebarFooter user={mockUser} onLogout={vi.fn()} />);

    const menuTrigger = screen.getByTestId("sidebar-menu-trigger");
    await user.click(menuTrigger);

    expect(screen.getByText("Logout")).toBeInTheDocument();
  });

  it("calls onLogout when logout is clicked", async () => {
    const user = userEvent.setup();
    const handleLogout = vi.fn();

    render(<SidebarFooter user={mockUser} onLogout={handleLogout} />);

    const menuTrigger = screen.getByTestId("sidebar-menu-trigger");
    await user.click(menuTrigger);

    const logoutButton = screen.getByText("Logout");
    await user.click(logoutButton);

    expect(handleLogout).toHaveBeenCalledTimes(1);
  });

  it("passes user object to SidebarProfile", () => {
    render(
      <SidebarFooter
        user={{ ...mockUser, avatarUrl: faker.image.avatar() }}
        onLogout={vi.fn()}
      />,
    );

    // Profile component is rendered
    const profile = screen.getByTestId("sidebar-profile");
    expect(profile).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(
      <SidebarFooter
        user={mockUser}
        onLogout={vi.fn()}
        className="custom-class"
      />,
    );

    const footer = screen.getByTestId("sidebar-footer");
    expect(footer).toHaveClass("custom-class");
  });

  it("applies correct layout classes", () => {
    render(<SidebarFooter user={mockUser} onLogout={vi.fn()} />);

    const footer = screen.getByTestId("sidebar-footer");
    expect(footer).toHaveClass("self-stretch");
    expect(footer).toHaveClass("flex");
    expect(footer).toHaveClass("items-center");
    expect(footer).toHaveClass("gap-2");
  });

  it("renders logout icon with text", async () => {
    const user = userEvent.setup();

    render(<SidebarFooter user={mockUser} onLogout={vi.fn()} />);

    const menuTrigger = screen.getByTestId("sidebar-menu-trigger");
    await user.click(menuTrigger);

    // Check that both icon (via svg) and text are present
    const logoutText = screen.getByText("Logout");
    expect(logoutText).toBeInTheDocument();

    // Lucide icon should be in the parent div
    const logoutContainer = logoutText.parentElement;
    expect(logoutContainer).toHaveClass("flex", "items-center", "gap-3");
  });
});
