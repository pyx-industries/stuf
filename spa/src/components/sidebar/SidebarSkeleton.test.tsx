import { render, screen } from "@testing-library/react";
import { SidebarSkeleton } from "./SidebarSkeleton";

describe("SidebarSkeleton", () => {
  it("renders the skeleton", () => {
    render(<SidebarSkeleton />);

    expect(screen.getByTestId("sidebar-skeleton")).toBeInTheDocument();
  });

  it("shows header by default", () => {
    render(<SidebarSkeleton />);

    expect(screen.getByTestId("sidebar-skeleton")).toBeInTheDocument();
    expect(screen.getByTestId("sidebar-header")).toBeInTheDocument();
  });

  it("shows header when hideHeader is false", () => {
    render(<SidebarSkeleton hideHeader={false} />);

    expect(screen.getByTestId("sidebar-skeleton")).toBeInTheDocument();
    expect(screen.getByTestId("sidebar-header")).toBeInTheDocument();
  });

  it("hides header when hideHeader is true", () => {
    render(<SidebarSkeleton hideHeader={true} />);

    expect(screen.getByTestId("sidebar-skeleton")).toBeInTheDocument();
    expect(screen.queryByTestId("sidebar-header")).not.toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<SidebarSkeleton className="custom-class" />);

    const skeleton = screen.getByTestId("sidebar-skeleton");
    expect(skeleton).toHaveClass("custom-class");
  });

  it("renders skeleton placeholders for navigation items", () => {
    render(<SidebarSkeleton />);

    const skeleton = screen.getByTestId("sidebar-skeleton");
    expect(skeleton).toBeInTheDocument();

    // Should have multiple skeleton elements (using Skeleton component from ui)
    const skeletons = skeleton.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders skeleton placeholder for profile section", () => {
    render(<SidebarSkeleton />);

    const skeleton = screen.getByTestId("sidebar-skeleton");
    expect(skeleton).toBeInTheDocument();

    // Should have skeleton elements in the footer area
    const skeletons = skeleton.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(5); // Multiple skeleton items
  });
});
