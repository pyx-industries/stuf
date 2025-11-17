import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { faker } from "@faker-js/faker";
import { Sidebar } from "./Sidebar";
import { UserRole, type Collection, type User } from "@/types";

const mockCollections: Collection[] = [
  { id: "collection-a", name: "Collections A" },
  { id: "collection-b", name: "Collections B" },
  { id: "collection-c", name: "Collections C" },
];

const mockAdminUser: User = {
  username: "c.reardon",
  name: "Cindy Reardon",
  email: "c.reardon@emailadress.com",
  roles: [UserRole.Admin],
  collections: {},
};

const mockRegularUser: User = {
  username: "john.doe",
  name: "John Doe",
  email: "john.doe@example.com",
  roles: [UserRole.ProjectParticipant],
  collections: {},
};

const defaultProps = {
  collections: mockCollections,
  user: mockAdminUser,
  onCollectionSelect: vi.fn(),
  onHomeClick: vi.fn(),
  onConfigClick: vi.fn(),
  onLogout: vi.fn(),
};

describe("Sidebar", () => {
  it("renders the component", () => {
    render(<Sidebar {...defaultProps} />);

    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
  });

  it("renders the header by default", () => {
    render(<Sidebar {...defaultProps} />);

    expect(screen.getByTestId("sidebar-header")).toBeInTheDocument();
    expect(screen.getByText("STUF")).toBeInTheDocument();
  });

  it("renders the header when hideHeader is false", () => {
    render(<Sidebar {...defaultProps} hideHeader={false} />);

    expect(screen.getByTestId("sidebar-header")).toBeInTheDocument();
    expect(screen.getByText("STUF")).toBeInTheDocument();
  });

  it("hides the header when hideHeader is true", () => {
    render(<Sidebar {...defaultProps} hideHeader={true} />);

    expect(screen.queryByTestId("sidebar-header")).not.toBeInTheDocument();
    expect(screen.queryByText("STUF")).not.toBeInTheDocument();
  });

  it("renders the collection navigation", () => {
    render(<Sidebar {...defaultProps} />);

    expect(screen.getByTestId("collection-nav")).toBeInTheDocument();
    expect(screen.getByText("Files home")).toBeInTheDocument();
    expect(screen.getByText("Collections A")).toBeInTheDocument();
  });

  it("renders the configuration nav item", () => {
    render(<Sidebar {...defaultProps} />);

    expect(screen.getByTestId("nav-item-configuration")).toBeInTheDocument();
    expect(screen.getByText("Configuration")).toBeInTheDocument();
  });

  it("renders the user profile", () => {
    render(<Sidebar {...defaultProps} />);

    expect(screen.getByTestId("sidebar-profile")).toBeInTheDocument();
    expect(screen.getByText("Cindy Reardon")).toBeInTheDocument();
    expect(screen.getByText("c.reardon@emailadress.com")).toBeInTheDocument();
  });

  it("renders the menu button", () => {
    render(<Sidebar {...defaultProps} />);

    expect(screen.getByTestId("sidebar-menu-trigger")).toBeInTheDocument();
  });

  it("calls onHomeClick when Files home is clicked", async () => {
    const user = userEvent.setup();
    const handleHomeClick = vi.fn();

    render(<Sidebar {...defaultProps} onHomeClick={handleHomeClick} />);

    const homeButton = screen.getByTestId("collection-nav-home");
    await user.click(homeButton);

    expect(handleHomeClick).toHaveBeenCalledTimes(1);
  });

  it("calls onCollectionSelect when collection is clicked", async () => {
    const user = userEvent.setup();
    const handleCollectionSelect = vi.fn();

    render(
      <Sidebar {...defaultProps} onCollectionSelect={handleCollectionSelect} />,
    );

    const collectionButton = screen.getByTestId("collection-item-collection-b");
    await user.click(collectionButton);

    expect(handleCollectionSelect).toHaveBeenCalledTimes(1);
    expect(handleCollectionSelect).toHaveBeenCalledWith("collection-b");
  });

  it("calls onConfigClick when Configuration is clicked", async () => {
    const user = userEvent.setup();
    const handleConfigClick = vi.fn();

    render(<Sidebar {...defaultProps} onConfigClick={handleConfigClick} />);

    const configButton = screen.getByTestId("nav-item-configuration");
    await user.click(configButton);

    expect(handleConfigClick).toHaveBeenCalledTimes(1);
  });

  it("renders menu button with MoreOptions", () => {
    render(<Sidebar {...defaultProps} />);

    expect(screen.getByTestId("sidebar-menu-trigger")).toBeInTheDocument();
  });

  it("shows logout option when menu is clicked", async () => {
    const user = userEvent.setup();

    render(<Sidebar {...defaultProps} />);

    const menuTrigger = screen.getByTestId("sidebar-menu-trigger");
    await user.click(menuTrigger);

    expect(screen.getByText("Logout")).toBeInTheDocument();
  });

  it("calls onLogout when logout is clicked", async () => {
    const user = userEvent.setup();
    const handleLogout = vi.fn();

    render(<Sidebar {...defaultProps} onLogout={handleLogout} />);

    const menuTrigger = screen.getByTestId("sidebar-menu-trigger");
    await user.click(menuTrigger);

    const logoutButton = screen.getByText("Logout");
    await user.click(logoutButton);

    expect(handleLogout).toHaveBeenCalledTimes(1);
  });

  it("shows selected state on Files home when isHomeSelected is true", () => {
    render(<Sidebar {...defaultProps} isHomeSelected={true} />);

    const homeButton = screen.getByTestId("collection-nav-home");
    expect(homeButton).toHaveAttribute("aria-pressed", "true");
  });

  it("shows selected state on collection when selectedCollectionId matches", () => {
    render(<Sidebar {...defaultProps} selectedCollectionId="collection-b" />);

    const collectionButton = screen.getByTestId("collection-item-collection-b");
    expect(collectionButton).toHaveAttribute("aria-pressed", "true");
    expect(collectionButton).toHaveClass("bg-primary");
  });

  it("renders with custom className", () => {
    render(<Sidebar {...defaultProps} className="custom-class" />);

    const sidebar = screen.getByTestId("sidebar");
    expect(sidebar).toHaveClass("custom-class");
  });

  it("passes user object to SidebarProfile", () => {
    render(
      <Sidebar
        {...defaultProps}
        user={{
          ...mockAdminUser,
          avatarUrl: faker.image.avatar(),
        }}
      />,
    );

    // Profile component is rendered
    const profile = screen.getByTestId("sidebar-profile");
    expect(profile).toBeInTheDocument();
  });

  it("menu trigger has cursor-pointer class", () => {
    render(<Sidebar {...defaultProps} />);

    const menuTrigger = screen.getByTestId("sidebar-menu-trigger");
    expect(menuTrigger).toHaveClass("cursor-pointer");
  });

  it("shows Configuration nav item for admin users", () => {
    render(<Sidebar {...defaultProps} user={mockAdminUser} />);

    expect(screen.getByTestId("nav-item-configuration")).toBeInTheDocument();
    expect(screen.getByText("Configuration")).toBeInTheDocument();
  });

  it("hides Configuration nav item for regular users", () => {
    render(<Sidebar {...defaultProps} user={mockRegularUser} />);

    expect(
      screen.queryByTestId("nav-item-configuration"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Configuration")).not.toBeInTheDocument();
  });

  it("hides Configuration nav item for limited users", () => {
    const limitedUser: User = {
      username: "limiteduser",
      name: "Limited User",
      email: "limited@example.com",
      roles: [UserRole.ProjectParticipant],
      collections: {},
    };

    render(<Sidebar {...defaultProps} user={limitedUser} />);

    expect(
      screen.queryByTestId("nav-item-configuration"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Configuration")).not.toBeInTheDocument();
  });

  it("renders skeleton when isLoading is true", () => {
    render(<Sidebar {...defaultProps} isLoading={true} />);

    expect(screen.getByTestId("sidebar-skeleton")).toBeInTheDocument();
  });

  it("skeleton shows header by default when loading", () => {
    render(<Sidebar {...defaultProps} isLoading={true} />);

    expect(screen.getByTestId("sidebar-skeleton")).toBeInTheDocument();
    expect(screen.getByTestId("sidebar-header")).toBeInTheDocument();
  });

  it("skeleton hides header when hideHeader is true and loading", () => {
    render(<Sidebar {...defaultProps} isLoading={true} hideHeader={true} />);

    expect(screen.getByTestId("sidebar-skeleton")).toBeInTheDocument();
    expect(screen.queryByTestId("sidebar-header")).not.toBeInTheDocument();
  });
});
