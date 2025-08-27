import Keycloak from 'keycloak-js';

// Keycloak configuration
const keycloakConfig = {
  url: process.env.REACT_APP_KEYCLOAK_URL || 'http://localhost:8080',
  realm: process.env.REACT_APP_KEYCLOAK_REALM || 'stuf',
  clientId: process.env.REACT_APP_KEYCLOAK_CLIENT_ID || 'stuf-spa'
};

// Keycloak instance - will be created lazily
let keycloak = null;

// Initialize Keycloak
export const initKeycloak = () => {
  if (!keycloak) {
    keycloak = new Keycloak(keycloakConfig);
  }
  
  // Only initialize if not already initialized
  if (!keycloak.authenticated && !keycloak.loginRequired) {
    return keycloak.init({
      onLoad: 'check-sso',
      silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
      pkceMethod: 'S256'
    });
  }
  
  // Return resolved promise if already initialized
  return Promise.resolve(keycloak.authenticated);
};

// Authentication functions
export const login = () => {
  if (!keycloak) throw new Error('Keycloak not initialized');
  return keycloak.login();
};

export const logout = () => {
  if (!keycloak) throw new Error('Keycloak not initialized');
  return keycloak.logout();
};

export const getToken = () => {
  if (!keycloak) return null;
  return keycloak.token;
};

export const isAuthenticated = () => {
  if (!keycloak) return false;
  return keycloak.authenticated;
};

export const getUserInfo = () => {
  if (!keycloak || !keycloak.authenticated) return null;
  
  return {
    username: keycloak.tokenParsed?.preferred_username,
    email: keycloak.tokenParsed?.email,
    name: keycloak.tokenParsed?.name,
    roles: keycloak.tokenParsed?.realm_access?.roles || []
  };
};

export const updateToken = () => {
  if (!keycloak) return Promise.reject('Keycloak not initialized');
  return keycloak.updateToken(30);
};

// Export the keycloak instance getter for debugging
export const getKeycloakInstance = () => keycloak;

export default keycloak;
