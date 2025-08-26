import pytest
from unittest.mock import Mock, patch, MagicMock
from fastapi.testclient import TestClient

@pytest.fixture
def mock_minio_client():
    """Mock MinIO client for unit tests"""
    with patch('api.storage.minio.minio_client') as mock:
        mock.upload_file.return_value = "test/user/file.txt"
        mock.list_objects.return_value = [
            {"name": "test/file1.txt", "size": 1024, "last_modified": "2023-01-01"}
        ]
        mock.download_file.return_value = (b"test content", {}, "text/plain")
        yield mock

@pytest.fixture
def mock_keycloak_validation():
    """Mock Keycloak validation for unit tests"""
    with patch('api.auth.middleware.validate_token') as mock:
        mock.return_value = {
            "active": True,
            "preferred_username": "testuser",
            "email": "testuser@example.com",
            "name": "Test User",
            "realm_access": {"roles": ["user", "collection-test"]}
        }
        yield mock

@pytest.fixture
def unit_test_client():
    """TestClient for unit tests with all external dependencies mocked"""
    from api.main import app
    return TestClient(app)
