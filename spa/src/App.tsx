import { ErrorBoundary } from "@/components/layout/error-boundary/ErrorBoundary";
import { Toaster } from "@/components/ui/sonner";
import { useEffect } from "react";
import { useAuth } from "react-oidc-context";
import { BrowserRouter, useNavigate, useRoutes } from "react-router-dom";
import { CollectionsProvider } from "./contexts/collections/CollectionsContext";
import { FilesProvider } from "./contexts/files/FilesContext";
import { routes } from "./routes";
import apiClient from "./services/api";

function AppRoutes() {
  return useRoutes(routes);
}

function AuthRedirectHandler({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to sign-in when user is logged out (token expired, etc.)
    if (!auth.isLoading && !auth.isAuthenticated && !auth.activeNavigator) {
      navigate("/sign-in");
    }
  }, [auth.isLoading, auth.isAuthenticated, auth.activeNavigator, navigate]);

  return <>{children}</>;
}

function App() {
  const auth = useAuth();

  // Configure API client with auth token SYNCHRONOUSLY during render
  // This ensures the token is set BEFORE providers mount and try to fetch data
  if (auth.user?.access_token) {
    apiClient.setAuth({
      user: {
        access_token: auth.user.access_token,
      },
    });
  }

  return (
    <BrowserRouter>
      <AuthRedirectHandler>
        <ErrorBoundary>
          <CollectionsProvider>
            <FilesProvider>
              <AppRoutes />
            </FilesProvider>
          </CollectionsProvider>
        </ErrorBoundary>
        <Toaster />
      </AuthRedirectHandler>
    </BrowserRouter>
  );
}

export default App;
