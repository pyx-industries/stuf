"""Centralized configuration for STUF Browser E2E Tests."""

import os
from urllib.parse import urlparse

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


def get_spa_host():
    """Return the host[:port] to match in browser URLs after OIDC redirects.

    Browsers suppress the default port (80 for HTTP, 443 for HTTPS), so a SPA
    running on port 80 will appear as 'http://spa-e2e/' not 'http://spa-e2e:80/'.
    """
    parsed = urlparse(SPA_URL)
    host = parsed.hostname or "localhost"
    port = parsed.port
    scheme = parsed.scheme or "http"
    default_port = 443 if scheme == "https" else 80
    if port and port != default_port:
        return f"{host}:{port}"
    return host


SPA_HOST = get_spa_host()

# Default credentials
DEFAULT_USERNAME = "admin@example.com"
DEFAULT_PASSWORD = "Password1!"
