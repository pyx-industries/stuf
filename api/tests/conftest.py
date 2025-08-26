import pytest
import os
import requests
from fastapi.testclient import TestClient
import httpx
import sys
from unittest.mock import patch

# Add the parent directory to sys.path to make the 'api' module importable
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

# Mock the MinioClient before importing app
with patch('api.storage.minio.MinioClient'):
    from api.main import app

# Keycloak test configuration
KEYCLOAK_URL = os.environ.get('KEYCLOAK_URL', 'http://localhost:8080')
KEYCLOAK_TEST_REALM = 'stuf-test'
KEYCLOAK_TEST_CLIENT_ID = 'stuf-test-spa'

# Test users
TEST_USERS = {
    'admin': {
        'username': 'test-admin',
        'password': 'test-password',
        'roles': ['admin', 'collection-test', 'collection-restricted', 'collection-shared']
    },
    'trust_architect': {
        'username': 'test-trust-architect',
        'password': 'test-password',
        'roles': ['trust-architect', 'collection-test', 'collection-restricted', 'collection-shared']
    },
    'full_user': {
        'username': 'test-user-full',
        'password': 'test-password',
        'roles': ['project-participant', 'collection-test', 'collection-restricted', 'collection-shared']
    },
    'limited_user': {
        'username': 'test-user-limited',
        'password': 'test-password',
        'roles': ['project-participant', 'collection-test']
    },
    'shared_user': {
        'username': 'test-user-shared',
        'password': 'test-password',
        'roles': ['project-participant', 'collection-shared']
    },
    'inactive_user': {
        'username': 'test-user-inactive',
        'password': 'test-password',
        'roles': ['project-participant', 'collection-test']
    }
}

@pytest.fixture
def client():
    """Return a TestClient for the FastAPI app"""
    # Use httpx directly to avoid TestClient version issues
    import httpx
    from fastapi.testclient import TestClient
    
    # Create a simple client that works with the current versions
    class SimpleTestClient:
        def __init__(self, app):
            self.app = app
            self.base_url = "http://testserver"
            
        def get(self, url, **kwargs):
            with TestClient(self.app) as client:
                return client.get(url, **kwargs)
                
        def post(self, url, **kwargs):
            with TestClient(self.app) as client:
                return client.post(url, **kwargs)
    
    return SimpleTestClient(app)

@pytest.fixture
def keycloak_token(request):
    """Get a real token from Keycloak for the specified user"""
    # Default to admin user if not specified
    user_type = getattr(request, 'param', 'admin')
    
    if user_type not in TEST_USERS:
        pytest.skip(f"Unknown user type: {user_type}")
        
    user = TEST_USERS[user_type]
    
    # Get token from Keycloak
    token_url = f"{KEYCLOAK_URL}/realms/{KEYCLOAK_TEST_REALM}/protocol/openid-connect/token"
    
    data = {
        'grant_type': 'password',
        'client_id': KEYCLOAK_TEST_CLIENT_ID,
        'username': user['username'],
        'password': user['password']
    }
    
    response = requests.post(token_url, data=data)
    
    if response.status_code != 200:
        pytest.skip(f"Failed to get token for {user_type}: {response.text}")
        
    token_data = response.json()
    return token_data['access_token']

@pytest.fixture
def authenticated_client(client, keycloak_token):
    """Return a TestClient with authentication headers set"""
    def _authenticated_client(token=keycloak_token):
        client.headers.update({"Authorization": f"Bearer {token}"})
        return client
    
    return _authenticated_client
