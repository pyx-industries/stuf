import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useUser } from "./useUser";
import { useAuth } from "react-oidc-context";
import type { User as OidcUser } from "oidc-client-ts";
import type { AuthContextProps } from "react-oidc-context";

// Mock react-oidc-context
vi.mock("react-oidc-context", () => ({
  useAuth: vi.fn(),
}));

// Helper function to create mock auth context
function createMockAuth(user?: OidcUser | null): AuthContextProps {
  return { user } as unknown as AuthContextProps;
}

describe("useUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("when user is not authenticated", () => {
    it("returns null when auth.user is undefined", () => {
      vi.mocked(useAuth).mockReturnValue(createMockAuth(undefined));

      const { result } = renderHook(() => useUser());

      expect(result.current).toBeNull();
    });

    it("returns null when auth.user.profile is undefined", () => {
      vi.mocked(useAuth).mockReturnValue(createMockAuth({} as OidcUser));

      const { result } = renderHook(() => useUser());

      expect(result.current).toBeNull();
    });

    it("returns null when auth.user.profile is null", () => {
      vi.mocked(useAuth).mockReturnValue(
        createMockAuth({ profile: null } as unknown as OidcUser),
      );

      const { result } = renderHook(() => useUser());

      expect(result.current).toBeNull();
    });
  });

  describe("when user is authenticated", () => {
    it("returns user with full name when given_name and family_name are present", () => {
      vi.mocked(useAuth).mockReturnValue(
        createMockAuth({
          profile: {
            given_name: "John",
            family_name: "Doe",
            email: "john.doe@example.com",
            collections: {
              "collection-1": ["read", "write"],
              "collection-2": ["read"],
            },
          },
        } as unknown as OidcUser),
      );

      const { result } = renderHook(() => useUser());

      expect(result.current).toEqual({
        name: "John Doe",
        email: "john.doe@example.com",
        collections: {
          "collection-1": ["read", "write"],
          "collection-2": ["read"],
        },
        roles: [],
      });
    });

    it("uses preferred_username when given_name is missing", () => {
      vi.mocked(useAuth).mockReturnValue(
        createMockAuth({
          profile: {
            family_name: "Doe",
            preferred_username: "johndoe",
            email: "john.doe@example.com",
            collections: {},
          },
        } as unknown as OidcUser),
      );

      const { result } = renderHook(() => useUser());

      expect(result.current?.name).toBe("johndoe");
    });

    it("uses preferred_username when family_name is missing", () => {
      vi.mocked(useAuth).mockReturnValue(
        createMockAuth({
          profile: {
            given_name: "John",
            preferred_username: "johndoe",
            email: "john.doe@example.com",
            collections: {},
          },
        } as unknown as OidcUser),
      );

      const { result } = renderHook(() => useUser());

      expect(result.current?.name).toBe("johndoe");
    });

    it("uses preferred_username when both given_name and family_name are missing", () => {
      vi.mocked(useAuth).mockReturnValue(
        createMockAuth({
          profile: {
            preferred_username: "johndoe",
            email: "john.doe@example.com",
            collections: {},
          },
        } as unknown as OidcUser),
      );

      const { result } = renderHook(() => useUser());

      expect(result.current?.name).toBe("johndoe");
    });

    it("defaults to 'Unknown User' when all name fields are missing", () => {
      vi.mocked(useAuth).mockReturnValue(
        createMockAuth({
          profile: {
            email: "user@example.com",
            collections: {},
          },
        } as unknown as OidcUser),
      );

      const { result } = renderHook(() => useUser());

      expect(result.current?.name).toBe("Unknown User");
    });

    it("defaults to empty string when email is missing", () => {
      vi.mocked(useAuth).mockReturnValue(
        createMockAuth({
          profile: {
            given_name: "John",
            family_name: "Doe",
            collections: {},
          },
        } as unknown as OidcUser),
      );

      const { result } = renderHook(() => useUser());

      expect(result.current?.email).toBe("");
    });

    it("handles missing collections field", () => {
      vi.mocked(useAuth).mockReturnValue(
        createMockAuth({
          profile: {
            given_name: "John",
            family_name: "Doe",
            email: "john.doe@example.com",
          },
        } as unknown as OidcUser),
      );

      const { result } = renderHook(() => useUser());

      expect(result.current?.collections).toBeUndefined();
    });

    it("handles empty collections object", () => {
      vi.mocked(useAuth).mockReturnValue(
        createMockAuth({
          profile: {
            given_name: "John",
            family_name: "Doe",
            email: "john.doe@example.com",
            collections: {},
          },
        } as unknown as OidcUser),
      );

      const { result } = renderHook(() => useUser());

      expect(result.current?.collections).toEqual({});
    });

    it("always returns empty roles array", () => {
      vi.mocked(useAuth).mockReturnValue(
        createMockAuth({
          profile: {
            given_name: "John",
            family_name: "Doe",
            email: "john.doe@example.com",
            collections: {},
            roles: ["admin", "user"], // Even if present in profile
          },
        } as unknown as OidcUser),
      );

      const { result } = renderHook(() => useUser());

      expect(result.current?.roles).toEqual([]);
    });

    it("handles complex collection permissions structure", () => {
      vi.mocked(useAuth).mockReturnValue(
        createMockAuth({
          profile: {
            given_name: "John",
            family_name: "Doe",
            email: "john.doe@example.com",
            collections: {
              "project-alpha": ["read", "write", "delete"],
              "project-beta": ["read"],
              "project-gamma": ["read", "write"],
            },
          },
        } as unknown as OidcUser),
      );

      const { result } = renderHook(() => useUser());

      expect(result.current?.collections).toEqual({
        "project-alpha": ["read", "write", "delete"],
        "project-beta": ["read"],
        "project-gamma": ["read", "write"],
      });
    });
  });
});
