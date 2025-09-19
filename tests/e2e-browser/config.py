"""Centralized configuration for STUF Browser E2E Tests."""

import os

# Test environment URLs - environment-aware defaults
SPA_URL = os.getenv("SPA_URL", "http://localhost:3100")
API_URL = os.getenv("API_URL", "http://localhost:8100")
KEYCLOAK_URL = os.getenv("KEYCLOAK_URL", "http://localhost:8180")


# Extract just the hostname:port for URL matching (for both localhost and internal Docker names)
def get_spa_host():
    """Get SPA host for URL matching (e.g., 'localhost:3100' or 'spa-e2e:3000')"""
    if "spa-e2e:3000" in SPA_URL:
        return "spa-e2e:3000"
    return "localhost:3100"


SPA_HOST = get_spa_host()

# Default credentials
DEFAULT_USERNAME = "admin@example.com"
DEFAULT_PASSWORD = "password"
