import { render, screen } from "@testing-library/react";
import { SidebarProfile } from "./SidebarProfile";
import { UserRole, type User } from "@/types";

const mockUser: User = {
  name: "John Doe",
  email: "john@example.com",
  roles: [UserRole.User],
};

describe("SidebarProfile", () => {
  it("renders name and email", () => {
    render(<SidebarProfile user={mockUser} />);

    expect(screen.getByTestId("sidebar-profile-name")).toHaveTextContent(
      "John Doe",
    );
    expect(screen.getByTestId("sidebar-profile-email")).toHaveTextContent(
      "john@example.com",
    );
  });

  it("renders fallback with initials when avatarUrl is not provided", () => {
    render(<SidebarProfile user={mockUser} />);

    expect(
      screen.getByTestId("sidebar-profile-avatar-fallback"),
    ).toHaveTextContent("JD");
  });

  it("truncates long names", () => {
    render(
      <SidebarProfile
        user={{
          name: "Dr. Christopher Alexander Montgomery Wellington III",
          email: "short@example.com",
          roles: [UserRole.User],
        }}
      />,
    );

    const nameElement = screen.getByTestId("sidebar-profile-name");
    expect(nameElement).toHaveClass("truncate");
  });

  it("truncates long emails", () => {
    render(
      <SidebarProfile
        user={{
          name: "Jane Doe",
          email: "very.long.email.address@corporate-company-domain.com",
          roles: [UserRole.User],
        }}
      />,
    );

    const emailElement = screen.getByTestId("sidebar-profile-email");
    expect(emailElement).toHaveClass("truncate");
  });

  it("renders with custom className", () => {
    render(<SidebarProfile user={mockUser} className="custom-class" />);

    const profile = screen.getByTestId("sidebar-profile");
    expect(profile).toHaveClass("custom-class");
  });
});
