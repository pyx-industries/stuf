import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import { SignIn } from "./SignIn";

const mockSigninRedirect = vi.fn();
const mockAuthState = {
  isAuthenticated: false,
  isLoading: false,
  signinRedirect: mockSigninRedirect,
};

vi.mock("react-oidc-context", async () => {
  const actual = await vi.importActual("react-oidc-context");
  return {
    ...actual,
    useAuth: () => mockAuthState,
  };
});

describe("SignIn", () => {
  beforeEach(() => {
    mockSigninRedirect.mockClear();
    mockAuthState.isAuthenticated = false;
  });

  const TestRouter = ({
    children,
    initialEntries,
  }: {
    children: React.ReactNode;
    initialEntries?: any[];
  }) => (
    <MemoryRouter
      initialEntries={initialEntries}
      future={{
        v7_startTransition: false,
        v7_relativeSplatPath: false,
      }}
    >
      {children}
    </MemoryRouter>
  );

  const renderWithRouter = () => {
    return render(
      <TestRouter>
        <SignIn />
      </TestRouter>,
    );
  };

  it("renders the sign-in page", () => {
    renderWithRouter();
    expect(screen.getByTestId("sign-in")).toBeInTheDocument();
  });

  it("renders the sign-in title", () => {
    renderWithRouter();
    expect(screen.getByTestId("sign-in-title")).toHaveTextContent(
      "Sign in to STUF",
    );
  });

  it("renders the description text", () => {
    renderWithRouter();
    expect(screen.getByTestId("sign-in-description")).toHaveTextContent(
      "STUF is a comprehensive system for secure file uploads developed by Pyx.",
    );
  });

  it("renders the Pyx website link", () => {
    renderWithRouter();
    const link = screen.getByTestId("sign-in-pyx-link");
    expect(link).toHaveAttribute("href", "https://pyx.io");
    expect(link).toHaveTextContent("Pyx Website");
  });

  it("renders the sign-in button", () => {
    renderWithRouter();
    expect(screen.getByTestId("sign-in-button")).toBeInTheDocument();
  });

  it("calls signinRedirect when sign-in button is clicked", async () => {
    const user = userEvent.setup();
    renderWithRouter();

    const signInButton = screen.getByTestId("sign-in-button");
    await user.click(signInButton);

    expect(mockSigninRedirect).toHaveBeenCalledTimes(1);
  });

  it("redirects to home when already authenticated", () => {
    mockAuthState.isAuthenticated = true;

    render(
      <TestRouter initialEntries={["/sign-in"]}>
        <Routes>
          <Route path="/sign-in" element={<SignIn />} />
          <Route
            path="/"
            element={<div data-testid="home-page">Home Page</div>}
          />
        </Routes>
      </TestRouter>,
    );

    // Should redirect to home, not show sign-in UI
    expect(screen.queryByTestId("sign-in")).not.toBeInTheDocument();
    expect(screen.getByTestId("home-page")).toBeInTheDocument();
  });

  it("redirects to the 'from' location when already authenticated", () => {
    mockAuthState.isAuthenticated = true;

    render(
      <TestRouter
        initialEntries={[
          { pathname: "/sign-in", state: { from: { pathname: "/files" } } },
        ]}
      >
        <Routes>
          <Route path="/sign-in" element={<SignIn />} />
          <Route
            path="/files"
            element={<div data-testid="files-page">Files Page</div>}
          />
          <Route
            path="/"
            element={<div data-testid="home-page">Home Page</div>}
          />
        </Routes>
      </TestRouter>,
    );

    // Should redirect to /files, not show sign-in UI or home
    expect(screen.queryByTestId("sign-in")).not.toBeInTheDocument();
    expect(screen.queryByTestId("home-page")).not.toBeInTheDocument();
    expect(screen.getByTestId("files-page")).toBeInTheDocument();
  });
});
