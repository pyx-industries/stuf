"""Centralized configuration for STUF Browser E2E Tests."""

import os

# Test environment URLs - Docker container defaults
SPA_URL = os.getenv("SPA_URL", "http://spa-e2e:3000")
API_URL = os.getenv("API_URL", "http://api-e2e:8000")

# IDP base URL for service health checks.
IDP_URL = os.getenv("IDP_URL", "http://zitadel-e2e:8080")

# OIDC discovery base URL (issuer as seen by clients).
OIDC_ISSUER_URL = os.getenv("OIDC_ISSUER_URL", IDP_URL)

# Login UI base URL — the Zitadel login screens are served by a separate
# zitadel-login container (routed through the Nginx proxy on the same port).
IDP_LOGIN_URL = os.getenv("IDP_LOGIN_URL", "")

# Playwright configuration
PLAYWRIGHT_HEADLESS = os.getenv("PLAYWRIGHT_HEADLESS", "true")
PLAYWRIGHT_SLOW_MO = int(os.getenv("PLAYWRIGHT_SLOW_MO", "0"))
PLAYWRIGHT_WORKERS = os.getenv("PLAYWRIGHT_WORKERS")
PLAYWRIGHT_BASE_URL = os.getenv("PLAYWRIGHT_BASE_URL")


# Extract just the hostname:port for URL matching (for both localhost and internal Docker names)
# SLOP: this is a stupid function and it's not clear why it needs to exist.
def get_spa_host():
    """Get SPA host for URL matching (e.g., 'localhost:3100' or 'spa-e2e:3000')"""
    if "spa-e2e:3000" in SPA_URL:
        return "spa-e2e:3000"
    return "localhost:3100"


SPA_HOST = get_spa_host()

# Default credentials
DEFAULT_USERNAME = "admin@example.com"
DEFAULT_PASSWORD = "Password1!"
