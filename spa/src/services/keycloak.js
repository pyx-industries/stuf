import Keycloak from 'keycloak-js';

// Keycloak configuration
const keycloakConfig = {
  url: process.env.REACT_APP_KEYCLOAK_URL || 'http://localhost:8080',
  realm: process.env.REACT_APP_KEYCLOAK_REALM || 'stuf',
  clientId: process.env.REACT_APP_KEYCLOAK_CLIENT_ID || 'stuf-spa'
};

// Keycloak instance - will be created lazily
let keycloak = null;
let initializationPromise = null;
let isInitialized = false;

// Initialize Keycloak
export const initKeycloak = () => {
  // If already initializing, return the same promise
  if (initializationPromise) {
    return initializationPromise;
  }
  
  // If already initialized, return the authentication status
  if (isInitialized && keycloak) {
    return Promise.resolve(keycloak.authenticated);
  }
  
  // Create keycloak instance if it doesn't exist
  if (!keycloak) {
    keycloak = new Keycloak(keycloakConfig);
  }
  
  // Start initialization and store the promise
  initializationPromise = keycloak.init({
    onLoad: 'check-sso',
    silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
    pkceMethod: 'S256'
  }).then((authenticated) => {
    // Mark as initialized
    isInitialized = true;
    // Clear the initialization promise
    initializationPromise = null;
    return authenticated;
  }).catch((error) => {
    // Clear the initialization promise on error
    initializationPromise = null;
    throw error;
  });
  
  return initializationPromise;
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
