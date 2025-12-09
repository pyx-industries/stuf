import ReactDOM from "react-dom/client";
import { AuthProvider } from "react-oidc-context";
import App from "./App";
import { getConfig } from "./config";
import { ThemeProvider } from "./contexts/ThemeContext";
import "./index.css";

const { keycloakUrl, keycloakRealm, keycloakClientId } = getConfig();

const authority = `${keycloakUrl}/realms/${keycloakRealm}`;

const oidcConfig = {
  authority,
  client_id: keycloakClientId,
  redirect_uri: window.location.origin,
  post_logout_redirect_uri: window.location.origin,
  response_type: "code",
  scope: "openid profile email stuf:access",
  automaticSilentRenew: true,
  includeIdTokenInSilentRenew: true,
  // Use default storage (localStorage) - works fine for most cases
  onSigninCallback: () => {
    // Clean up URL after successful sign in
    window.history.replaceState({}, document.title, window.location.pathname);
  },
};

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root container missing in index.html");
}
const root = ReactDOM.createRoot(container);
root.render(
  <ThemeProvider defaultTheme="system" storageKey="stuf-ui-theme">
    <AuthProvider {...oidcConfig}>
      <App />
    </AuthProvider>
  </ThemeProvider>,
);
