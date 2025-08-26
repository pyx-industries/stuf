import pytest
import os
import requests
import time
from fastapi.testclient import TestClient
from api.main import app

# E2E configuration - uses REAL services
KEYCLOAK_URL = os.environ.get('KEYCLOAK_URL', 'http://localhost:8080')
KEYCLOAK_REALM = os.environ.get('KEYCLOAK_REALM', 'stuf')
KEYCLOAK_CLIENT_ID = os.environ.get('KEYCLOAK_API_CLIENT_ID', 'stuf-api')

@pytest.fixture(scope="session")
def wait_for_services():
    """Wait for docker-compose services to be ready"""
    import subprocess
    
    # Start services if not already running
    subprocess.run(['docker-compose', 'up', '-d', 'keycloak', 'minio'], 
                   check=False, capture_output=True)
    
    # Wait for Keycloak
    for _ in range(30):
        try:
            response = requests.get(f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}", timeout=2)
            if response.status_code == 200:
                break
        except requests.exceptions.RequestException:
            pass
        time.sleep(2)
    else:
        pytest.skip("Keycloak not available for E2E tests")
    
    # Wait for MinIO
    minio_url = "http://localhost:9000"
    for _ in range(30):
        try:
            response = requests.get(f"{minio_url}/minio/health/ready", timeout=2)
            if response.status_code == 200:
                break
        except requests.exceptions.RequestException:
            pass
        time.sleep(2)
    else:
        pytest.skip("MinIO not available for E2E tests")

@pytest.fixture
def real_keycloak_token(wait_for_services):
    """Get a real token from Keycloak"""
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
    """TestClient for E2E tests - NO MOCKS"""
    return TestClient(app)

@pytest.fixture
def e2e_authenticated_client(e2e_client, real_keycloak_token):
    """Authenticated client for E2E tests"""
    e2e_client.headers.update({"Authorization": f"Bearer {real_keycloak_token}"})
    return e2e_client
