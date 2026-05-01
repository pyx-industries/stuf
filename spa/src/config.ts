/**
 * Application configuration
 */

// Extend the Window interface to include our runtime config
declare global {
  interface Window {
    __STUF_CONFIG__?: StufConfig;
  }
}

export interface StufConfig {
  apiBaseUrl: string;
  oidcAuthority: string;
  oidcClientId: string;
}

const DEFAULTS: StufConfig = {
  apiBaseUrl: "http://localhost:8000",
  oidcAuthority: "http://localhost:8080/realms/stuf",
  oidcClientId: "stuf-spa",
};

let configCache: StufConfig | null = null;

/**
 * Get the application configuration.
 * Reads from window.__STUF_CONFIG__ (set by docker-entrypoint.sh at runtime).
 * Falls back to defaults if not available (e.g., local development outside Docker).
 */
export function getConfig(): StufConfig {
  if (configCache) {
    return configCache;
  }

  if (typeof window !== "undefined" && window.__STUF_CONFIG__) {
    configCache = window.__STUF_CONFIG__;
    return configCache;
  }

  // Using defaults - log warning
  console.warn(
    "STUF Config: Using default configuration. Set window.__STUF_CONFIG__ for runtime configuration.",
  );

  configCache = DEFAULTS;
  return configCache;
}
