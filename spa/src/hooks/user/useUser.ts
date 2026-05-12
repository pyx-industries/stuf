import { useState, useEffect, useMemo } from "react";
import { useAuth } from "react-oidc-context";
import apiClient from "@/services/api";
import type { User } from "@/types";

export function useUser(): User | null {
  const auth = useAuth();
  const [collections, setCollections] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (!auth.isAuthenticated || !auth.user?.access_token) {
      setCollections({});
      return;
    }

    apiClient
      .request("/api/me")
      .then((data) => setCollections(data.collections ?? {}))
      .catch(() => setCollections({}));
  }, [auth.isAuthenticated, auth.user?.access_token]);

  return useMemo(() => {
    if (!auth.user?.profile) {
      return null;
    }

    const profile = auth.user.profile as Record<string, unknown>;
    const username = (profile?.preferred_username as string) || "";

    return {
      username,
      name:
        profile?.given_name && profile?.family_name
          ? `${profile.given_name} ${profile.family_name}`
          : username || "Unknown User",
      email: (profile?.email as string) || "",
      collections,
      roles: [],
    };
  }, [auth.user, collections]);
}
