import pytest
import os
import requests
from fastapi.testclient import TestClient
from api.main import app

# E2E configuration - uses browser E2E Docker services
# Use internal Docker network URLs when running in container
KEYCLOAK_URL = os.environ.get(
    "KEYCLOAK_URL", "http://keycloak-e2e:8080"
)  # Internal Docker network
KEYCLOAK_REALM = os.environ.get("KEYCLOAK_REALM", "stuf")
KEYCLOAK_CLIENT_ID = os.environ.get("KEYCLOAK_CLIENT_ID", "stuf-api")


def check_keycloak_ready():
    """Check if Keycloak is ready."""
    try:
        # Use same approach as browser E2E - basic connectivity check
        print(f"DEBUG API E2E: Checking Keycloak at {KEYCLOAK_URL}")
        response = requests.get(KEYCLOAK_URL, timeout=5)
        print(f"DEBUG API E2E: Keycloak response: {response.status_code}")
        # Keycloak returns 302 redirect when accessible
        return response.status_code < 400
    except requests.exceptions.RequestException as e:
        print(f"DEBUG API E2E: Keycloak check failed: {e}")
        return False


def check_minio_ready():
    """Check if MinIO is ready."""
    try:
        # Use HTTP check like browser E2E does, internal Docker network
        import requests

        response = requests.get(
            "http://minio-e2e:9000", timeout=5
        )  # Internal Docker network
        return response.status_code < 500  # Any response better than server error
    except Exception:
        return False


@pytest.fixture
def real_keycloak_token():
    """Get a real token from Keycloak using password grant for a test user"""
    if not check_keycloak_ready():
        pytest.skip("Keycloak is not available for E2E tests")

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
    if not check_keycloak_ready() or not check_minio_ready():
        pytest.skip("Required services not available for E2E tests")

    return TestClient(app)


@pytest.fixture
def limited_keycloak_token():
    """Get a token for a user with limited permissions"""
    if not check_keycloak_ready():
        pytest.skip("Keycloak is not available for E2E tests")

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
