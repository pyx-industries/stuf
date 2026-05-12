import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useUser } from "./useUser";
import { useAuth } from "react-oidc-context";
import apiClient from "@/services/api";
import type { User as OidcUser } from "oidc-client-ts";
import type { AuthContextProps } from "react-oidc-context";

vi.mock("react-oidc-context", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/services/api", () => ({
  default: {
    request: vi.fn(),
  },
}));

function createMockAuth(user?: OidcUser | null): AuthContextProps {
  return {
    user,
    isAuthenticated: !!(user?.access_token),
  } as unknown as AuthContextProps;
}

const BASE_PROFILE = {
  preferred_username: "johndoe",
  given_name: "John",
  family_name: "Doe",
  email: "john.doe@example.com",
};

describe("useUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.request).mockResolvedValue({ collections: {} });
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
    it("returns user with full name and collections from /api/me", async () => {
      const mockCollections = {
        "collection-1": ["read", "write"],
        "collection-2": ["read"],
      };
      vi.mocked(apiClient.request).mockResolvedValue({ collections: mockCollections });
      vi.mocked(useAuth).mockReturnValue(
        createMockAuth({
          profile: BASE_PROFILE,
          access_token: "test-token",
        } as unknown as OidcUser),
      );

      const { result } = renderHook(() => useUser());

      await waitFor(() => {
        expect(result.current?.collections).toEqual(mockCollections);
      });

      expect(result.current).toEqual({
        username: "johndoe",
        name: "John Doe",
        email: "john.doe@example.com",
        collections: mockCollections,
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
          },
        } as unknown as OidcUser),
      );

      const { result } = renderHook(() => useUser());

      expect(result.current?.username).toBe("johndoe");
      expect(result.current?.name).toBe("johndoe");
    });

    it("uses preferred_username when family_name is missing", () => {
      vi.mocked(useAuth).mockReturnValue(
        createMockAuth({
          profile: {
            given_name: "John",
            preferred_username: "johndoe",
            email: "john.doe@example.com",
          },
        } as unknown as OidcUser),
      );

      const { result } = renderHook(() => useUser());

      expect(result.current?.username).toBe("johndoe");
      expect(result.current?.name).toBe("johndoe");
    });

    it("uses preferred_username when both given_name and family_name are missing", () => {
      vi.mocked(useAuth).mockReturnValue(
        createMockAuth({
          profile: {
            preferred_username: "johndoe",
            email: "john.doe@example.com",
          },
        } as unknown as OidcUser),
      );

      const { result } = renderHook(() => useUser());

      expect(result.current?.username).toBe("johndoe");
      expect(result.current?.name).toBe("johndoe");
    });

    it("defaults to 'Unknown User' when all name fields are missing", () => {
      vi.mocked(useAuth).mockReturnValue(
        createMockAuth({
          profile: {
            email: "user@example.com",
          },
        } as unknown as OidcUser),
      );

      const { result } = renderHook(() => useUser());

      expect(result.current?.username).toBe("");
      expect(result.current?.name).toBe("Unknown User");
    });

    it("defaults to empty string when email is missing", () => {
      vi.mocked(useAuth).mockReturnValue(
        createMockAuth({
          profile: {
            given_name: "John",
            family_name: "Doe",
          },
        } as unknown as OidcUser),
      );

      const { result } = renderHook(() => useUser());

      expect(result.current?.email).toBe("");
    });

    it("returns empty collections when no access token", () => {
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

      expect(result.current?.collections).toEqual({});
    });

    it("returns empty collections when /api/me call fails", async () => {
      vi.mocked(apiClient.request).mockRejectedValue(new Error("Network error"));
      vi.mocked(useAuth).mockReturnValue(
        createMockAuth({
          profile: BASE_PROFILE,
          access_token: "test-token",
        } as unknown as OidcUser),
      );

      const { result } = renderHook(() => useUser());

      await waitFor(() => {
        expect(vi.mocked(apiClient.request)).toHaveBeenCalled();
      });

      expect(result.current?.collections).toEqual({});
    });

    it("always returns empty roles array", () => {
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

      expect(result.current?.roles).toEqual([]);
    });

    it("fetches complex collection permissions from /api/me", async () => {
      const mockCollections = {
        "project-alpha": ["read", "write", "delete"],
        "project-beta": ["read"],
        "project-gamma": ["read", "write"],
      };
      vi.mocked(apiClient.request).mockResolvedValue({ collections: mockCollections });
      vi.mocked(useAuth).mockReturnValue(
        createMockAuth({
          profile: BASE_PROFILE,
          access_token: "test-token",
        } as unknown as OidcUser),
      );

      const { result } = renderHook(() => useUser());

      await waitFor(() => {
        expect(result.current?.collections).toEqual(mockCollections);
      });
    });
  });
});
