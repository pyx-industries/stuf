import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider, WebStorageStateStore } from 'react-oidc-context';
import App from './App';
import { ThemeProvider } from './contexts/ThemeContext';
import './index.css';

// DEBUG: Log OIDC configuration and environment
console.log('DEBUG OIDC: Environment variables:', {
  REACT_APP_KEYCLOAK_URL: process.env.REACT_APP_KEYCLOAK_URL,
  REACT_APP_KEYCLOAK_REALM: process.env.REACT_APP_KEYCLOAK_REALM,
  REACT_APP_KEYCLOAK_CLIENT_ID: process.env.REACT_APP_KEYCLOAK_CLIENT_ID,
  window_origin: window.location.origin,
});

const authority = `${process.env.REACT_APP_KEYCLOAK_URL || 'http://localhost:8080'}/realms/${process.env.REACT_APP_KEYCLOAK_REALM || 'stuf'}`;
console.log('DEBUG OIDC: Authority URL:', authority);

// DEBUG: Test Keycloak connectivity with explicit headers logging
const testRequest = new Request(`${authority}/.well-known/openid_configuration`);
console.log('DEBUG OIDC: Request details:', {
  url: testRequest.url,
  origin_header: window.location.origin,
  current_location: window.location.href,
  user_agent: navigator.userAgent
});

fetch(testRequest)
  .then(response => {
    console.log('DEBUG OIDC: Keycloak connectivity test - Status:', response.status);
    if (response.ok) {
      return response.json();
    }
    throw new Error(`HTTP ${response.status}`);
  })
  .then(config => {
    console.log('DEBUG OIDC: Keycloak OIDC config retrieved successfully');
    console.log('DEBUG OIDC: Available endpoints:', Object.keys(config));
  })
  .catch(error => {
    console.error('DEBUG OIDC: Failed to connect to Keycloak:', error);
    console.error('DEBUG OIDC: This explains why OIDC library is not initializing');
  });

const oidcConfig = {
  authority,
  client_id: process.env.REACT_APP_KEYCLOAK_CLIENT_ID || 'stuf-spa',
  redirect_uri: window.location.origin,
  response_type: 'code',
  scope: 'openid stuf:access',
  automaticSilentRenew: true,
  includeIdTokenInSilentRenew: true,
  // Use default storage (localStorage) - works fine for most cases
  onSigninCallback: () => {
    console.log('DEBUG OIDC: Sign-in callback executed');
    // Clean up URL after successful sign in
    window.history.replaceState({}, document.title, window.location.pathname);
  },
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ThemeProvider defaultTheme="system" storageKey="stuf-ui-theme">
    <AuthProvider {...oidcConfig}>
      <App />
    </AuthProvider>
  </ThemeProvider>
);
