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
    console.log('Keycloak initialization already in progress, returning existing promise');
    return initializationPromise;
  }
  
  // If already initialized, return the authentication status
  if (isInitialized && keycloak) {
    console.log('Keycloak already initialized, returning authentication status:', keycloak.authenticated);
    return Promise.resolve(keycloak.authenticated);
  }
  
  console.log('Starting fresh Keycloak initialization');
  
  // Always create a fresh keycloak instance to avoid "already initialized" errors
  keycloak = new Keycloak(keycloakConfig);
  
  // Start initialization and store the promise
  initializationPromise = keycloak.init({
    onLoad: 'check-sso',
    silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
    pkceMethod: 'S256'
  }).then((authenticated) => {
    console.log('Keycloak initialization successful, authenticated:', authenticated);
    // Mark as initialized
    isInitialized = true;
    // Clear the initialization promise
    initializationPromise = null;
    return authenticated;
  }).catch((error) => {
    console.error('Keycloak initialization failed:', error);
    // Reset everything on error to allow retry
    keycloak = null;
    isInitialized = false;
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
