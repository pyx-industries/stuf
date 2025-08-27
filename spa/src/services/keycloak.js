import Keycloak from 'keycloak-js';

// Keycloak configuration
const keycloakConfig = {
  url: process.env.REACT_APP_KEYCLOAK_URL || 'http://localhost:8080',
  realm: process.env.REACT_APP_KEYCLOAK_REALM || 'stuf',
  clientId: process.env.REACT_APP_KEYCLOAK_CLIENT_ID || 'stuf-spa'
};

// Singleton pattern for Keycloak instance
class KeycloakService {
  constructor() {
    this.keycloak = null;
    this.initializationPromise = null;
    this.isInitialized = false;
  }

  async init() {
    // If already initializing, return the same promise
    if (this.initializationPromise) {
      console.log('Keycloak initialization already in progress, returning existing promise');
      return this.initializationPromise;
    }
    
    // If already initialized, return the authentication status
    if (this.isInitialized && this.keycloak) {
      console.log('Keycloak already initialized, returning authentication status:', this.keycloak.authenticated);
      return Promise.resolve(this.keycloak.authenticated);
    }
    
    console.log('Starting fresh Keycloak initialization');
    
    // Only create a new instance if we don't have one
    if (!this.keycloak) {
      this.keycloak = new Keycloak(keycloakConfig);
    }
    
    // Start initialization and store the promise
    this.initializationPromise = this.keycloak.init({
      onLoad: 'check-sso',
      checkLoginIframe: false,
      enableLogging: true
    }).then((authenticated) => {
      console.log('Keycloak initialization successful, authenticated:', authenticated);
      this.isInitialized = true;
      this.initializationPromise = null;
      return authenticated;
    }).catch((error) => {
      console.error('Keycloak initialization failed:', error);
      console.error('Keycloak config:', keycloakConfig);
      
      // Test basic connectivity to Keycloak
      fetch(`${keycloakConfig.url}/realms/${keycloakConfig.realm}`)
        .then(response => {
          console.log('Keycloak realm connectivity test:', response.status);
          if (!response.ok) {
            console.error('Keycloak realm not accessible');
          }
        })
        .catch(fetchError => {
          console.error('Cannot reach Keycloak server:', fetchError);
        });
      
      // Reset state
      this.keycloak = null;
      this.isInitialized = false;
      this.initializationPromise = null;
      
      throw new Error(`Keycloak initialization failed: ${error?.message || 'Connection or configuration error'}`);
    });
    
    return this.initializationPromise;
  }

  getKeycloak() {
    return this.keycloak;
  }

  getInitializationStatus() {
    return {
      isInitialized: this.isInitialized,
      hasKeycloak: !!this.keycloak,
      isInitializing: !!this.initializationPromise
    };
  }
}

// Create singleton instance
const keycloakService = new KeycloakService();

// Initialize Keycloak
export const initKeycloak = () => {
  return keycloakService.init();
};

// Authentication functions
export const login = () => {
  const keycloak = keycloakService.getKeycloak();
  if (!keycloak || !keycloakService.isInitialized) {
    console.error('Keycloak not properly initialized. Current state:', {
      keycloak: !!keycloak,
      isInitialized: keycloakService.isInitialized
    });
    throw new Error('Keycloak not initialized');
  }
  return keycloak.login();
};

export const logout = () => {
  const keycloak = keycloakService.getKeycloak();
  if (!keycloak) throw new Error('Keycloak not initialized');
  return keycloak.logout();
};

export const getToken = () => {
  const keycloak = keycloakService.getKeycloak();
  if (!keycloak) return null;
  return keycloak.token;
};

export const isAuthenticated = () => {
  const keycloak = keycloakService.getKeycloak();
  if (!keycloak) return false;
  return keycloak.authenticated;
};

export const getUserInfo = () => {
  const keycloak = keycloakService.getKeycloak();
  if (!keycloak || !keycloak.authenticated) return null;
  
  return {
    username: keycloak.tokenParsed?.preferred_username,
    email: keycloak.tokenParsed?.email,
    name: keycloak.tokenParsed?.name,
    roles: keycloak.tokenParsed?.realm_access?.roles || []
  };
};

export const updateToken = () => {
  const keycloak = keycloakService.getKeycloak();
  if (!keycloak) return Promise.reject('Keycloak not initialized');
  return keycloak.updateToken(30);
};

// Export the keycloak instance getter for debugging
export const getKeycloakInstance = () => keycloakService.getKeycloak();

export default keycloakService;
