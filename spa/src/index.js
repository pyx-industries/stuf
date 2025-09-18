import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider, WebStorageStateStore } from 'react-oidc-context';
import App from './App';

const oidcConfig = {
  authority: `${process.env.REACT_APP_KEYCLOAK_URL || 'http://localhost:8080'}/realms/${process.env.REACT_APP_KEYCLOAK_REALM || 'stuf'}`,
  client_id: process.env.REACT_APP_KEYCLOAK_CLIENT_ID || 'stuf-spa',
  redirect_uri: window.location.origin,
  response_type: 'code',
  scope: 'openid stuf:access',
  automaticSilentRenew: true,
  includeIdTokenInSilentRenew: true,
  // Store auth state in sessionStorage to persist across page reloads
  userStore: new WebStorageStateStore({ store: window.sessionStorage }),
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <AuthProvider {...oidcConfig}>
    <App />
  </AuthProvider>
);
