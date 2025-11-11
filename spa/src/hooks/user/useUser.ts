import { useMemo } from "react";
import { useAuth } from "react-oidc-context";
import type { User } from "@/types";

/**
 * Hook to get user info from auth context
 * Parses the JWT token profile and returns a User object
 */
export function useUser(): User | null {
  const auth = useAuth();

  return useMemo(() => {
    if (!auth.user?.profile) {
      return null;
    }

    const profile = auth.user.profile as Record<string, unknown>;
    const username = (profile?.preferred_username as string) || "";

    return {
      username, // Keycloak preferred_username - matches backend user.username
      name:
        profile?.given_name && profile?.family_name
          ? `${profile.given_name} ${profile.family_name}`
          : username || "Unknown User",
      email: (profile?.email as string) || "",
      collections: profile?.collections as Record<string, string[]>,
      roles: [], // Roles not currently used - permissions are collection-based
    };
  }, [auth.user]);
}
