import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { StufConfig } from "./config";
import { getConfig } from "./config";

describe("getConfig", () => {
  let originalConfig: StufConfig | undefined;

  beforeEach(() => {
    // Clear the config cache by reimporting the module
    vi.resetModules();
    // Save the original config if it exists
    originalConfig = window.__STUF_CONFIG__;
    // Clear console.warn to avoid noise in test output
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore original config
    if (originalConfig) {
      window.__STUF_CONFIG__ = originalConfig;
    } else {
      delete window.__STUF_CONFIG__;
    }
    vi.restoreAllMocks();
  });

  it("returns defaults when window.__STUF_CONFIG__ is undefined", async () => {
    delete window.__STUF_CONFIG__;

    // Need to re-import to clear the cache
    const { getConfig: freshGetConfig } = await import("./config");

    const config = freshGetConfig();

    expect(config).toEqual({
      apiBaseUrl: "http://localhost:8000",
      keycloakUrl: "http://localhost:8080",
      keycloakRealm: "stuf",
      keycloakClientId: "stuf-spa",
    });
  });

  it("returns runtime config when window.__STUF_CONFIG__ is set", async () => {
    const runtimeConfig: StufConfig = {
      apiBaseUrl: "https://api.example.com",
      keycloakUrl: "https://auth.example.com",
      keycloakRealm: "production",
      keycloakClientId: "prod-client",
    };

    window.__STUF_CONFIG__ = runtimeConfig;

    // Need to re-import to clear the cache
    const { getConfig: freshGetConfig } = await import("./config");

    const config = freshGetConfig();

    expect(config).toEqual(runtimeConfig);
  });

  it("logs warning when using defaults", async () => {
    delete window.__STUF_CONFIG__;

    // Need to re-import to clear the cache
    const { getConfig: freshGetConfig } = await import("./config");

    freshGetConfig();

    expect(console.warn).toHaveBeenCalledWith(
      "STUF Config: Using default configuration. Set window.__STUF_CONFIG__ for runtime configuration.",
    );
  });

  it("caches the config after first call", () => {
    const runtimeConfig: StufConfig = {
      apiBaseUrl: "https://api.example.com",
      keycloakUrl: "https://auth.example.com",
      keycloakRealm: "production",
      keycloakClientId: "prod-client",
    };

    window.__STUF_CONFIG__ = runtimeConfig;

    const config1 = getConfig();
    const config2 = getConfig();

    // Should return the same object reference (cached)
    expect(config1).toBe(config2);
  });

  it("does not log warning when runtime config is set", async () => {
    const runtimeConfig: StufConfig = {
      apiBaseUrl: "https://api.example.com",
      keycloakUrl: "https://auth.example.com",
      keycloakRealm: "production",
      keycloakClientId: "prod-client",
    };

    window.__STUF_CONFIG__ = runtimeConfig;

    // Need to re-import to clear the cache
    const { getConfig: freshGetConfig } = await import("./config");

    freshGetConfig();

    expect(console.warn).not.toHaveBeenCalled();
  });
});
