import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MobileSidebar } from "./MobileSidebar";
import { UserRole, type Collection, type User } from "@/types";

const mockCollections: Collection[] = [
  { id: "collection-a", name: "Collections A" },
  { id: "collection-b", name: "Collections B" },
  { id: "collection-c", name: "Collections C" },
];

const mockUser: User = {
  username: "c.reardon",
  name: "Cindy Reardon",
  email: "c.reardon@emailadress.com",
  roles: [UserRole.Admin],
  collections: {},
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
  it("renders the mobile navbar", () => {
    render(<MobileSidebar {...defaultProps} />);

    expect(screen.getByTestId("mobile-navbar")).toBeInTheDocument();
  });

  it("renders the STUF logo in navbar", () => {
    render(<MobileSidebar {...defaultProps} />);

    expect(screen.getByTestId("mobile-navbar-logo")).toBeInTheDocument();
    expect(screen.getByText("STUF")).toBeInTheDocument();
  });

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

  it("renders with custom className on navbar", () => {
    render(<MobileSidebar {...defaultProps} className="custom-class" />);

    const navbar = screen.getByTestId("mobile-navbar");
    expect(navbar).toHaveClass("custom-class");
  });

  it("hides sidebar header since logo is in navbar", async () => {
    const user = userEvent.setup();
    render(<MobileSidebar {...defaultProps} />);

    // Open sidebar
    const toggleButton = screen.getByTestId("mobile-sidebar-toggle");
    await user.click(toggleButton);

    // Header should not be in the sidebar (hideHeader={true})
    const sidebar = screen.getByTestId("mobile-sidebar");
    expect(sidebar).toBeInTheDocument();

    // Since the header is hidden, we check that STUF only appears once (in navbar)
    const stufElements = screen.getAllByText("STUF");
    expect(stufElements).toHaveLength(1); // Only in navbar, not in sidebar
  });

  it("closes sidebar when window is resized to desktop size", async () => {
    const user = userEvent.setup();
    render(<MobileSidebar {...defaultProps} />);

    // Open sidebar
    const toggleButton = screen.getByTestId("mobile-sidebar-toggle");
    await user.click(toggleButton);

    let sidebar = screen.getByTestId("mobile-sidebar");
    expect(sidebar).toHaveClass("translate-x-0");

    // Simulate window resize to desktop size (>= 1024px)
    act(() => {
      global.innerWidth = 1024;
      global.dispatchEvent(new Event("resize"));
    });

    // Wait for the state update
    await waitFor(() => {
      sidebar = screen.getByTestId("mobile-sidebar");
      expect(sidebar).toHaveClass("-translate-x-full");
    });
  });
});
