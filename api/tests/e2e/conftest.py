import pytest
import os
import requests
from fastapi.testclient import TestClient
from api.main import app

# E2E configuration - uses REAL services
KEYCLOAK_URL = os.environ.get('KEYCLOAK_URL', 'http://localhost:8080')
KEYCLOAK_REALM = os.environ.get('KEYCLOAK_REALM', 'stuf')
KEYCLOAK_CLIENT_ID = os.environ.get('KEYCLOAK_API_CLIENT_ID', 'stuf-api')

def check_keycloak_ready():
    """Check if Keycloak is ready."""
    try:
        response = requests.get(f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}", timeout=2)
        return response.status_code == 200
    except requests.exceptions.RequestException:
        return False

def check_minio_ready():
    """Check if MinIO is ready."""
    try:
        minio_url = "http://localhost:9000"
        response = requests.get(f"{minio_url}/minio/health/ready", timeout=2)
        return response.status_code == 200
    except requests.exceptions.RequestException:
        return False

@pytest.fixture
def real_keycloak_token():
    """Get a real token from Keycloak"""
    if not check_keycloak_ready():
        pytest.skip("Keycloak is not available for E2E tests")
    
    token_url = f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/token"
    
    # Use client credentials flow for E2E tests
    data = {
        'grant_type': 'client_credentials',
        'client_id': KEYCLOAK_CLIENT_ID,
        'client_secret': os.environ.get('KEYCLOAK_API_CLIENT_SECRET', 'some-secret-value')
    }
    
    response = requests.post(token_url, data=data)
    if response.status_code != 200:
        pytest.skip(f"Could not get token from Keycloak: {response.text}")
    
    return response.json()['access_token']

@pytest.fixture
def e2e_client():
    """TestClient for E2E tests - NO MOCKS, depends on real services being up"""
    if not check_keycloak_ready() or not check_minio_ready():
        pytest.skip("Required services not available for E2E tests")
    
    return TestClient(app)

@pytest.fixture
def e2e_authenticated_client(e2e_client, real_keycloak_token):
    """Authenticated client for E2E tests"""
    e2e_client.headers.update({"Authorization": f"Bearer {real_keycloak_token}"})
    return e2e_client
