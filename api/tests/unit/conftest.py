import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from api.tests.fixtures.test_data import SAMPLE_TOKEN_RESPONSES, SAMPLE_FILES

@pytest.fixture
def mock_minio_client():
    """Mock MinIO client for unit tests - patches the singleton instance"""
    with patch('api.storage.minio.minio_client') as mock:
        # Configure default successful responses
        mock.upload_file.return_value = "test/user/file.txt"
        mock.list_objects.return_value = SAMPLE_FILES
        mock.download_file.return_value = (b"test content", {"original_filename": "test.txt"}, "text/plain")
        mock.get_presigned_url.return_value = "https://minio.example.com/presigned-url"
        mock.delete_object.return_value = True
        yield mock

@pytest.fixture
def mock_keycloak_validation():
    """Mock Keycloak token validation for unit tests"""
    with patch('api.auth.middleware.validate_token') as mock:
        mock.return_value = SAMPLE_TOKEN_RESPONSES["valid"]
        yield mock

@pytest.fixture
def unit_client():
    """TestClient for unit tests - all external dependencies should be mocked"""
    from api.main import app
    return TestClient(app)

@pytest.fixture
def mock_user():
    """Mock authenticated user for unit tests"""
    from api.auth.middleware import User
    return User(
        username="testuser",
        email="testuser@example.com",
        full_name="Test User",
        roles=["user", "collection-test"],
        active=True
    )
