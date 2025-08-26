import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from api.main import app

@pytest.fixture
def bdd_mock_authentication():
    """Mock authentication for BDD scenario tests"""
    def _mock_auth(username, roles):
        roles_list = [role.strip() for role in roles.split(',')]
        
        # Create a patch for the validate_token function
        patch_validate_token = patch('api.auth.middleware.validate_token')
        mock_validate_token = patch_validate_token.start()
        
        # Configure the mock
        mock_token_info = {
            "preferred_username": username,
            "email": f"{username}@example.com",
            "name": f"{username.capitalize()} User",
            "realm_access": {"roles": roles_list},
            "active": True
        }
        mock_validate_token.return_value = mock_token_info
        
        return patch_validate_token
    
    return _mock_auth

@pytest.fixture
def bdd_client():
    """TestClient for BDD tests"""
    return TestClient(app)

@pytest.fixture
def bdd_mock_services():
    """Mock external services for BDD tests"""
    minio_mock = MagicMock()
    minio_mock.list_objects.return_value = [
        {"name": "test/file1.txt", "size": 1024, "last_modified": "2023-01-01"}
    ]
    
    with patch('api.storage.minio.minio_client', minio_mock):
        yield minio_mock
