import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MobileSidebar } from "./MobileSidebar";
import { UserRole, type Collection, type User } from "@/types";

const mockCollections: Collection[] = [
  { id: "collection-a", name: "Collections A" },
  { id: "collection-b", name: "Collections B" },
  { id: "collection-c", name: "Collections C" },
];

const mockUser: User = {
  name: "Cindy Reardon",
  email: "c.reardon@emailadress.com",
  roles: [UserRole.Admin],
};

const defaultProps = {
  collections: mockCollections,
  user: mockUser,
  onCollectionSelect: vi.fn(),
  onHomeClick: vi.fn(),
  onConfigClick: vi.fn(),
  onLogout: vi.fn(),
};

describe("MobileSidebar", () => {
  it("renders the hamburger button", () => {
    render(<MobileSidebar {...defaultProps} />);

    expect(screen.getByTestId("mobile-sidebar-toggle")).toBeInTheDocument();
  });

  it("sidebar is hidden by default", () => {
    render(<MobileSidebar {...defaultProps} />);

    const sidebar = screen.getByTestId("mobile-sidebar");
    expect(sidebar).toHaveClass("-translate-x-full");
  });

  it("opens sidebar when hamburger is clicked", async () => {
    const user = userEvent.setup();
    render(<MobileSidebar {...defaultProps} />);

    const toggleButton = screen.getByTestId("mobile-sidebar-toggle");
    await user.click(toggleButton);

    const sidebar = screen.getByTestId("mobile-sidebar");
    expect(sidebar).toHaveClass("translate-x-0");
    expect(sidebar).not.toHaveClass("-translate-x-full");
  });

  it("shows overlay when sidebar is open", async () => {
    const user = userEvent.setup();
    render(<MobileSidebar {...defaultProps} />);

    const toggleButton = screen.getByTestId("mobile-sidebar-toggle");
    await user.click(toggleButton);

    expect(screen.getByTestId("mobile-sidebar-overlay")).toBeInTheDocument();
  });

  it("closes sidebar when overlay is clicked", async () => {
    const user = userEvent.setup();
    render(<MobileSidebar {...defaultProps} />);

    // Open sidebar
    const toggleButton = screen.getByTestId("mobile-sidebar-toggle");
    await user.click(toggleButton);

    // Click overlay
    const overlay = screen.getByTestId("mobile-sidebar-overlay");
    await user.click(overlay);

    const sidebar = screen.getByTestId("mobile-sidebar");
    expect(sidebar).toHaveClass("-translate-x-full");
  });

  it("closes sidebar when hamburger is clicked again", async () => {
    const user = userEvent.setup();
    render(<MobileSidebar {...defaultProps} />);

    const toggleButton = screen.getByTestId("mobile-sidebar-toggle");

    // Open
    await user.click(toggleButton);
    let sidebar = screen.getByTestId("mobile-sidebar");
    expect(sidebar).toHaveClass("translate-x-0");

    // Close
    await user.click(toggleButton);
    sidebar = screen.getByTestId("mobile-sidebar");
    expect(sidebar).toHaveClass("-translate-x-full");
  });

  it("closes sidebar when collection is selected", async () => {
    const user = userEvent.setup();
    const handleCollectionSelect = vi.fn();

    render(
      <MobileSidebar
        {...defaultProps}
        onCollectionSelect={handleCollectionSelect}
      />,
    );

    // Open sidebar
    const toggleButton = screen.getByTestId("mobile-sidebar-toggle");
    await user.click(toggleButton);

    // Click collection
    const collectionButton = screen.getByTestId("collection-item-collection-a");
    await user.click(collectionButton);

    expect(handleCollectionSelect).toHaveBeenCalledWith("collection-a");

    const sidebar = screen.getByTestId("mobile-sidebar");
    expect(sidebar).toHaveClass("-translate-x-full");
  });

  it("closes sidebar when Files home is clicked", async () => {
    const user = userEvent.setup();
    const handleHomeClick = vi.fn();

    render(<MobileSidebar {...defaultProps} onHomeClick={handleHomeClick} />);

    // Open sidebar
    const toggleButton = screen.getByTestId("mobile-sidebar-toggle");
    await user.click(toggleButton);

    // Click home
    const homeButton = screen.getByTestId("collection-nav-home");
    await user.click(homeButton);

    expect(handleHomeClick).toHaveBeenCalledTimes(1);

    const sidebar = screen.getByTestId("mobile-sidebar");
    expect(sidebar).toHaveClass("-translate-x-full");
  });

  it("closes sidebar when Configuration is clicked", async () => {
    const user = userEvent.setup();
    const handleConfigClick = vi.fn();

    render(
      <MobileSidebar {...defaultProps} onConfigClick={handleConfigClick} />,
    );

    // Open sidebar
    const toggleButton = screen.getByTestId("mobile-sidebar-toggle");
    await user.click(toggleButton);

    // Click config
    const configButton = screen.getByTestId("nav-item-configuration");
    await user.click(configButton);

    expect(handleConfigClick).toHaveBeenCalledTimes(1);

    const sidebar = screen.getByTestId("mobile-sidebar");
    expect(sidebar).toHaveClass("-translate-x-full");
  });

  it("renders with custom className on toggle button", () => {
    render(<MobileSidebar {...defaultProps} className="custom-class" />);

    const toggleButton = screen.getByTestId("mobile-sidebar-toggle");
    expect(toggleButton).toHaveClass("custom-class");
  });
});
