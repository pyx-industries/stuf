import Keycloak from 'keycloak-js';

// Keycloak configuration
const keycloakConfig = {
  url: process.env.REACT_APP_KEYCLOAK_URL || 'http://localhost:8080',
  realm: process.env.REACT_APP_KEYCLOAK_REALM || 'stuf',
  clientId: process.env.REACT_APP_KEYCLOAK_CLIENT_ID || 'stuf-spa'
};

// Create Keycloak instance
const keycloak = new Keycloak(keycloakConfig);

// Initialize Keycloak
export const initKeycloak = () => {
  return keycloak.init({
    onLoad: 'check-sso',
    silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
    pkceMethod: 'S256'
  });
};

// Authentication functions
export const login = () => {
  return keycloak.login();
};

export const logout = () => {
  return keycloak.logout();
};

export const getToken = () => {
  return keycloak.token;
};

export const isAuthenticated = () => {
  return keycloak.authenticated;
};

export const getUserInfo = () => {
  if (!keycloak.authenticated) return null;
  
  return {
    username: keycloak.tokenParsed?.preferred_username,
    email: keycloak.tokenParsed?.email,
    name: keycloak.tokenParsed?.name,
    roles: keycloak.tokenParsed?.realm_access?.roles || []
  };
};

export const updateToken = () => {
  return keycloak.updateToken(30);
};

export default keycloak;
