import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useCollections, CollectionsProvider } from "./CollectionsContext";
import { useUser } from "@/hooks/user/useUser";
import collectionsService from "@/services/collections";
import { toast } from "sonner";
import { ApplicationError } from "@/errors/api";
import type { User, Collection, ServiceError } from "@/types";

// Mock dependencies
vi.mock("@/hooks/user/useUser");
vi.mock("@/services/collections");
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
  },
}));

// Helper to render hook with provider
function renderWithProvider() {
  return renderHook(() => useCollections(), {
    wrapper: ({ children }) => (
      <CollectionsProvider>{children}</CollectionsProvider>
    ),
  });
}

describe("CollectionsContext", () => {
  const mockUser: User = {
    name: "Test User",
    email: "test@example.com",
    collections: {
      "collection-1": ["read", "write"],
      "collection-2": ["read"],
    },
    roles: [],
  };

  const mockCollections: Collection[] = [
    { id: "1", name: "collection-1", fileCount: 10 },
    { id: "2", name: "collection-2", fileCount: 5 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useUser).mockReturnValue(mockUser);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("useCollections hook", () => {
    it("throws error when used outside CollectionsProvider", () => {
      // Suppress console error for this test
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        renderHook(() => useCollections());
      }).toThrow("useCollections must be used within a CollectionsProvider");

      consoleSpy.mockRestore();
    });

    it("returns context value when used within provider", () => {
      const { result } = renderWithProvider();

      expect(result.current).toBeDefined();
      expect(result.current.collections).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(typeof result.current.fetchCollections).toBe("function");
    });
  });

  describe("initial state", () => {
    it("starts with empty collections, not loading, and no error", () => {
      const { result } = renderWithProvider();

      expect(result.current.collections).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  describe("fetchCollections", () => {
    describe("when user is not authenticated", () => {
      it("resets state when user is null", async () => {
        vi.mocked(useUser).mockReturnValue(null);

        const { result } = renderWithProvider();

        await result.current.fetchCollections();

        expect(result.current.collections).toEqual([]);
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe(null);
        expect(collectionsService.getCollections).not.toHaveBeenCalled();
      });
    });

    describe("successful fetch", () => {
      it("fetches and sets collections successfully", async () => {
        vi.mocked(collectionsService.getCollections).mockResolvedValue({
          collections: mockCollections,
          errors: [],
        });

        const { result } = renderWithProvider();

        expect(result.current.loading).toBe(false);

        await result.current.fetchCollections();

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
          expect(result.current.collections).toEqual(mockCollections);
          expect(result.current.error).toBe(null);
        });

        expect(collectionsService.getCollections).toHaveBeenCalledWith(
          mockUser,
        );
        expect(toast.error).not.toHaveBeenCalled();
      });

      it("clears previous error on successful fetch", async () => {
        // First fetch fails
        vi.mocked(collectionsService.getCollections).mockRejectedValueOnce(
          new ApplicationError("Failed", "Try again"),
        );

        const { result } = renderWithProvider();

        await result.current.fetchCollections();

        await waitFor(() => {
          expect(result.current.error).toBe("Failed");
        });

        // Second fetch succeeds
        vi.mocked(collectionsService.getCollections).mockResolvedValueOnce({
          collections: mockCollections,
          errors: [],
        });

        await result.current.fetchCollections();

        await waitFor(() => {
          expect(result.current.error).toBe(null);
          expect(result.current.collections).toEqual(mockCollections);
        });
      });
    });

    describe("partial success", () => {
      it("handles partial success with some collections loaded", async () => {
        const errors: ServiceError[] = [
          {
            message: "Failed to fetch collection-3",
            action: "Check permissions",
          },
        ];

        vi.mocked(collectionsService.getCollections).mockResolvedValue({
          collections: mockCollections,
          errors,
        });

        const { result } = renderWithProvider();

        await result.current.fetchCollections();

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
          expect(result.current.collections).toEqual(mockCollections);
          expect(result.current.error).toBe("Failed to fetch 1 collection");
        });

        expect(toast.error).toHaveBeenCalledWith(
          "Failed to fetch collection-3",
          {
            description: "Check permissions",
          },
        );
      });

      it("shows plural error message for multiple failures", async () => {
        const errors: ServiceError[] = [
          {
            message: "Failed to fetch collection-3",
            action: "Check permissions",
          },
          {
            message: "Failed to fetch collection-4",
            action: "Check permissions",
          },
        ];

        vi.mocked(collectionsService.getCollections).mockResolvedValue({
          collections: mockCollections,
          errors,
        });

        const { result } = renderWithProvider();

        await result.current.fetchCollections();

        await waitFor(() => {
          expect(result.current.error).toBe("Failed to fetch 2 collections");
        });

        expect(toast.error).toHaveBeenCalledTimes(2);
      });

      it("shows toast for each partial failure", async () => {
        const errors: ServiceError[] = [
          {
            message: "Failed to fetch collection-3",
            action: "Check permissions for collection-3",
          },
          {
            message: "Failed to fetch collection-4",
            action: "Check permissions for collection-4",
          },
        ];

        vi.mocked(collectionsService.getCollections).mockResolvedValue({
          collections: mockCollections,
          errors,
        });

        const { result } = renderWithProvider();

        await result.current.fetchCollections();

        await waitFor(() => {
          expect(toast.error).toHaveBeenCalledTimes(2);
        });

        expect(toast.error).toHaveBeenNthCalledWith(
          1,
          "Failed to fetch collection-3",
          { description: "Check permissions for collection-3" },
        );
        expect(toast.error).toHaveBeenNthCalledWith(
          2,
          "Failed to fetch collection-4",
          { description: "Check permissions for collection-4" },
        );
      });
    });

    describe("complete failure", () => {
      it("handles complete failure when no collections loaded", async () => {
        const errors: ServiceError[] = [
          { message: "Failed to fetch collection-1", action: "Try again" },
          { message: "Failed to fetch collection-2", action: "Try again" },
        ];

        vi.mocked(collectionsService.getCollections).mockResolvedValue({
          collections: [],
          errors,
        });

        const { result } = renderWithProvider();

        await result.current.fetchCollections();

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
          expect(result.current.collections).toEqual([]);
          expect(result.current.error).toBe("Failed to fetch collections");
        });

        expect(toast.error).toHaveBeenCalledTimes(2);
      });
    });

    describe("ApplicationError handling", () => {
      it("handles ApplicationError and shows toast", async () => {
        const appError = new ApplicationError(
          "Service unavailable",
          "Please try again later",
        );

        vi.mocked(collectionsService.getCollections).mockRejectedValue(
          appError,
        );

        const { result } = renderWithProvider();

        await result.current.fetchCollections();

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
          expect(result.current.error).toBe("Service unavailable");
        });

        expect(toast.error).toHaveBeenCalledWith("Service unavailable", {
          description: "Please try again later",
        });
      });
    });

    describe("unexpected error handling", () => {
      it("throws unexpected errors for error boundary", async () => {
        const unexpectedError = new Error("Unexpected error");

        vi.mocked(collectionsService.getCollections).mockRejectedValue(
          unexpectedError,
        );

        const { result } = renderWithProvider();

        await expect(async () => {
          await result.current.fetchCollections();
        }).rejects.toThrow("Unexpected error");

        expect(toast.error).not.toHaveBeenCalled();
      });
    });
  });

  describe("dependency on user.collections", () => {
    it("recreates fetchCollections when user.collections changes", () => {
      const { result, rerender } = renderWithProvider();
      const firstFetch = result.current.fetchCollections;

      // Change user collections
      vi.mocked(useUser).mockReturnValue({
        ...mockUser,
        collections: {
          "collection-3": ["read"],
        },
      });

      rerender();

      const secondFetch = result.current.fetchCollections;

      expect(firstFetch).not.toBe(secondFetch);
    });

    it("keeps same fetchCollections when user.collections unchanged", () => {
      const { result, rerender } = renderWithProvider();
      const firstFetch = result.current.fetchCollections;

      // Rerender without changing user.collections
      rerender();

      const secondFetch = result.current.fetchCollections;

      expect(firstFetch).toBe(secondFetch);
    });
  });

  describe("memoization", () => {
    it("memoizes context value based on state and fetchCollections", async () => {
      vi.mocked(collectionsService.getCollections).mockResolvedValue({
        collections: mockCollections,
        errors: [],
      });

      const { result, rerender } = renderWithProvider();
      const firstValue = result.current;

      // Rerender without state change
      rerender();

      expect(result.current).toBe(firstValue);

      // Trigger state change
      await result.current.fetchCollections();

      await waitFor(() => {
        expect(result.current).not.toBe(firstValue);
      });
    });
  });
});
