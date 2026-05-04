import os
import sys
from pathlib import Path

import pytest
import requests
from fastapi.testclient import TestClient

from api.main import app

# Import the shared service readiness fixture
# This ensures all services are ready before API E2E tests start

# Add the browser E2E helpers to Python path for shared modules
browser_e2e_path = Path(__file__).parent.parent.parent.parent / "tests" / "e2e-browser"
if not browser_e2e_path.exists():
    # In Docker container, the helpers are in the current directory
    browser_e2e_path = Path(__file__).parent.parent.parent
sys.path.insert(0, str(browser_e2e_path))

# Import shared service health check fixture
try:
    from helpers.service_health import ensure_services_ready  # noqa: F401
except ImportError:
    # Fallback if import fails
    ensure_services_ready = None

# OIDC configuration — use discovery to find the token endpoint so the fixtures
# are provider-agnostic (works with both Keycloak and Zitadel).
OIDC_ISSUER_URL = os.environ.get("OIDC_ISSUER_URL", "http://keycloak-e2e:8080/realms/stuf")

# Scopes for user (password grant) and service account (client_credentials) tokens.
# Override these env vars when running against Zitadel.  Keycloak defaults use the
# stuf:access scope; Zitadel requires project-audience and role scopes instead.
OIDC_USER_SCOPES = os.environ.get("OIDC_USER_SCOPES", "openid stuf:access")
OIDC_SERVICE_ACCOUNT_SCOPES = os.environ.get("OIDC_SERVICE_ACCOUNT_SCOPES", "stuf:access")

# SPA client ID for the password-grant user fixture.
OIDC_SPA_CLIENT_ID = os.environ.get("OIDC_SPA_CLIENT_ID", "stuf-spa")

# Service-account credentials — written to /bootstrap/generated.env by zitadel-init
# for the Zitadel profile; defaults match the Keycloak realm-export.json fixture.
OIDC_SERVICE_ACCOUNT_CLIENT_ID = os.environ.get(
    "OIDC_SERVICE_ACCOUNT_CLIENT_ID",
    os.environ.get("ZITADEL_BACKUP_SERVICE_CLIENT_ID", "backup-service"),
)
OIDC_SERVICE_ACCOUNT_CLIENT_SECRET = os.environ.get(
    "OIDC_SERVICE_ACCOUNT_CLIENT_SECRET",
    os.environ.get("ZITADEL_BACKUP_SERVICE_CLIENT_SECRET", "backup-service-secret"),
)

_token_endpoint: str | None = None


def _get_token_endpoint() -> str:
    """Fetch the token endpoint from OIDC discovery (cached)."""
    global _token_endpoint
    if not _token_endpoint:
        try:
            resp = requests.get(
                f"{OIDC_ISSUER_URL}/.well-known/openid-configuration", timeout=10
            )
            resp.raise_for_status()
            _token_endpoint = resp.json()["token_endpoint"]
        except Exception:
            # Fallback for backwards compatibility when discovery is not reachable
            _token_endpoint = (
                f"{OIDC_ISSUER_URL}/protocol/openid-connect/token"
            )
    return _token_endpoint


@pytest.fixture
def real_keycloak_token(ensure_services_ready):  # noqa: F811
    """Get a real user token using the password grant."""

    data = {
        "grant_type": "password",
        "client_id": OIDC_SPA_CLIENT_ID,
        "username": "testuser",
        "password": "password",
        "scope": OIDC_USER_SCOPES,
    }

    response = requests.post(_get_token_endpoint(), data=data)

    if response.status_code != 200:
        pytest.skip(f"Could not get user token from IDP: {response.text}")

    return response.json()["access_token"]


@pytest.fixture
def e2e_client():
    """TestClient for E2E tests - NO MOCKS, depends on real services being up"""
    return TestClient(app)


@pytest.fixture
def limited_keycloak_token(ensure_services_ready):  # noqa: F811
    """Get a token for a user with limited permissions."""

    data = {
        "grant_type": "password",
        "client_id": OIDC_SPA_CLIENT_ID,
        "username": "limiteduser",
        "password": "password",
        "scope": OIDC_USER_SCOPES,
    }

    response = requests.post(_get_token_endpoint(), data=data)

    if response.status_code != 200:
        pytest.skip(f"Could not get limited user token from IDP: {response.text}")

    return response.json()["access_token"]


@pytest.fixture
def e2e_authenticated_client(e2e_client, real_keycloak_token):
    """Authenticated client for E2E tests"""
    e2e_client.headers.update({"Authorization": f"Bearer {real_keycloak_token}"})
    return e2e_client


@pytest.fixture
def e2e_limited_client(e2e_client, limited_keycloak_token):
    """Limited user client for E2E tests"""
    e2e_client.headers.update({"Authorization": f"Bearer {limited_keycloak_token}"})
    return e2e_client


@pytest.fixture
def service_account_token(ensure_services_ready):  # noqa: F811
    """Get a real service account token using the client credentials grant."""

    data = {
        "grant_type": "client_credentials",
        "client_id": OIDC_SERVICE_ACCOUNT_CLIENT_ID,
        "client_secret": OIDC_SERVICE_ACCOUNT_CLIENT_SECRET,
        "scope": OIDC_SERVICE_ACCOUNT_SCOPES,
    }

    response = requests.post(_get_token_endpoint(), data=data)

    if response.status_code != 200:
        pytest.skip(
            f"Could not get service account token from IDP: {response.text}"
        )

    return response.json()["access_token"]


@pytest.fixture
def e2e_service_account_client(e2e_client, service_account_token):
    """Service account client for E2E tests"""
    e2e_client.headers.update({"Authorization": f"Bearer {service_account_token}"})
    return e2e_client
