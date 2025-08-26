import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from api.main import app

@pytest.fixture
def mock_external_services():
    """Mock external services for integration tests"""
    minio_mock = MagicMock()
    keycloak_mock = MagicMock()
    
    with patch('api.storage.minio.minio_client', minio_mock), \
         patch('requests.post') as requests_mock:
        
        # Configure Keycloak mock
        requests_mock.return_value.status_code = 200
        requests_mock.return_value.json.return_value = {
            "active": True,
            "preferred_username": "testuser",
            "realm_access": {"roles": ["collection-test"]}
        }
        
        # Configure MinIO mock
        minio_mock.upload_file.return_value = "test/user/file.txt"
        minio_mock.list_objects.return_value = []
        
        yield {
            'minio': minio_mock,
            'keycloak': requests_mock
        }

@pytest.fixture
def integration_client():
    """TestClient for integration tests"""
    return TestClient(app)

@pytest.fixture
def authenticated_headers():
    """Headers with valid authentication for integration tests"""
    return {"Authorization": "Bearer valid-test-token"}
