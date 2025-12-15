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

# E2E configuration - uses browser E2E Docker services
# Use internal Docker network URLs when running in container
KEYCLOAK_URL = os.environ.get(
    "KEYCLOAK_URL", "http://keycloak-e2e:8080"
)  # Internal Docker network
KEYCLOAK_REALM = os.environ.get("KEYCLOAK_REALM", "stuf")
KEYCLOAK_CLIENT_ID = os.environ.get("KEYCLOAK_CLIENT_ID", "stuf-api")


@pytest.fixture
def real_keycloak_token(ensure_services_ready):  # noqa: F811
    """Get a real token from Keycloak using password grant for a test user"""

    token_url = f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/token"

    # Use password grant with test user for E2E tests
    data = {
        "grant_type": "password",
        "client_id": "stuf-spa",  # Use SPA client for user authentication
        "username": "testuser",
        "password": "password",
        "scope": "openid stuf:access",
    }

    response = requests.post(token_url, data=data)

    if response.status_code != 200:
        pytest.skip(f"Could not get token from Keycloak: {response.text}")

    token_data = response.json()
    access_token = token_data["access_token"]

    return access_token


@pytest.fixture
def e2e_client():
    """TestClient for E2E tests - NO MOCKS, depends on real services being up"""
    return TestClient(app)


@pytest.fixture
def limited_keycloak_token(ensure_services_ready):  # noqa: F811
    """Get a token for a user with limited permissions"""

    token_url = f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/token"

    # Use limiteduser which should have limited permissions
    data = {
        "grant_type": "password",
        "client_id": "stuf-spa",
        "username": "limiteduser",
        "password": "password",
        "scope": "openid stuf:access",
    }

    response = requests.post(token_url, data=data)

    if response.status_code != 200:
        pytest.skip(f"Could not get limited token from Keycloak: {response.text}")

    token_data = response.json()
    access_token = token_data["access_token"]

    return access_token


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
    """Get a real service account token from Keycloak using client credentials"""

    token_url = f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/token"

    # Use client credentials grant for service account
    data = {
        "grant_type": "client_credentials",
        "client_id": "backup-service",
        "client_secret": "backup-service-secret",
        "scope": "stuf:access",
    }

    response = requests.post(token_url, data=data)

    if response.status_code != 200:
        pytest.skip(
            f"Could not get service account token from Keycloak: {response.text}"
        )

    token_data = response.json()
    access_token = token_data["access_token"]

    return access_token


@pytest.fixture
def e2e_service_account_client(e2e_client, service_account_token):
    """Service account client for E2E tests"""
    e2e_client.headers.update({"Authorization": f"Bearer {service_account_token}"})
    return e2e_client
