import { useEffect } from "react";
import { useAuth } from "react-oidc-context";
import apiService from "../services/api";

export const useApi = () => {
  const auth = useAuth();

  useEffect(() => {
    // Provide auth context to API service
    apiService.setAuth(auth);
  }, [auth]);

  return apiService;
};
