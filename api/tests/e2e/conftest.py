import pytest
import os
import requests
from fastapi.testclient import TestClient
from api.main import app

# E2E configuration - uses REAL services
# Use the same external URL that the host machine can reach
KEYCLOAK_URL = os.environ.get('KEYCLOAK_URL', 'http://localhost:8080')
KEYCLOAK_REALM = os.environ.get('KEYCLOAK_REALM', 'stuf')
KEYCLOAK_CLIENT_ID = os.environ.get('KEYCLOAK_CLIENT_ID', 'stuf-api')

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
        import socket
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(2)
        result = sock.connect_ex(('localhost', 9000))
        sock.close()
        return result == 0
    except:
        return False

@pytest.fixture
def real_keycloak_token():
    """Get a real token from Keycloak using password grant for a test user"""
    if not check_keycloak_ready():
        pytest.skip("Keycloak is not available for E2E tests")
    
    token_url = f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/token"
    
    # Use password grant with test user for E2E tests
    data = {
        'grant_type': 'password',
        'client_id': 'stuf-spa',  # Use SPA client for user authentication
        'username': 'testuser',
        'password': 'password',
        'scope': 'openid stuf:access'
    }
    
    
    response = requests.post(token_url, data=data)
    
    if response.status_code != 200:
        pytest.skip(f"Could not get token from Keycloak: {response.text}")
    
    token_data = response.json()
    access_token = token_data['access_token']
    
    return access_token

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
