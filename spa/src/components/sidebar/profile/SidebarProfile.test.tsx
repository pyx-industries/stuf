import { render, screen } from "@testing-library/react";
import { SidebarProfile } from "./SidebarProfile";

describe("SidebarProfile", () => {
  it("renders name and email", () => {
    render(<SidebarProfile name="John Doe" email="john@example.com" />);

    expect(screen.getByTestId("sidebar-profile-name")).toHaveTextContent(
      "John Doe",
    );
    expect(screen.getByTestId("sidebar-profile-email")).toHaveTextContent(
      "john@example.com",
    );
  });

  it("renders fallback with initials when avatarUrl is not provided", () => {
    render(<SidebarProfile name="John Doe" email="john@example.com" />);

    expect(
      screen.getByTestId("sidebar-profile-avatar-fallback"),
    ).toHaveTextContent("JD");
  });

  it("truncates long names", () => {
    render(
      <SidebarProfile
        name="Dr. Christopher Alexander Montgomery Wellington III"
        email="short@example.com"
      />,
    );

    const nameElement = screen.getByTestId("sidebar-profile-name");
    expect(nameElement).toHaveClass("truncate");
  });

  it("truncates long emails", () => {
    render(
      <SidebarProfile
        name="Jane Doe"
        email="very.long.email.address@corporate-company-domain.com"
      />,
    );

    const emailElement = screen.getByTestId("sidebar-profile-email");
    expect(emailElement).toHaveClass("truncate");
  });

  it("renders with custom className", () => {
    render(
      <SidebarProfile
        name="John Doe"
        email="john@example.com"
        className="custom-class"
      />,
    );

    const profile = screen.getByTestId("sidebar-profile");
    expect(profile).toHaveClass("custom-class");
  });
});
