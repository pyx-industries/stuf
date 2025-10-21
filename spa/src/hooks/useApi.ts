import { useEffect } from "react";
import { useAuth } from "react-oidc-context";
import apiService from "../services/api";
import type { AuthContext } from "@/types/services/api";

export const useApi = () => {
  const auth = useAuth();

  useEffect(() => {
    // Transform react-oidc-context auth to our AuthContext type
    // This will be moved to the main application logic
    const authContext: AuthContext = {
      user: auth.user
        ? {
            access_token: auth.user.access_token,
          }
        : undefined,
    };

    // Provide auth context to API service
    apiService.setAuth(authContext);
  }, [auth.user]);

  return apiService;
};
