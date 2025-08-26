import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
import requests # Import requests to patch it
from api.main import app
from api.auth.middleware import get_current_user, User
from api.tests.fixtures.test_data import SAMPLE_TOKEN_RESPONSES, SAMPLE_FILES

@pytest.fixture
def mock_external_services():
    """Mock external services for integration tests - mocks HTTP calls to external services"""
    minio_mock = MagicMock()
    
    with patch('api.storage.minio.minio_client', minio_mock), \
         patch('auth.middleware.validate_token') as keycloak_mock:
        
        # Configure Keycloak token validation mock
        keycloak_mock.return_value = SAMPLE_TOKEN_RESPONSES["valid"]
        
        # Configure MinIO service mock
        minio_mock.upload_file.return_value = "test/user/file.txt"
        minio_mock.list_objects.return_value = SAMPLE_FILES[:2]  # Return only 2 files as expected
        minio_mock.download_file.return_value = (b"test content", {"original_filename": "test.txt"}, "text/plain")
        minio_mock.get_presigned_url.return_value = "https://minio.example.com/presigned-url"
        
        yield {
            'minio': minio_mock,
            'keycloak': keycloak_mock
        }

@pytest.fixture
def integration_client(mock_external_services):
    """TestClient for integration tests - external services are mocked"""
    return TestClient(app)

@pytest.fixture
def authenticated_headers():
    """Headers with valid authentication token for integration tests"""
    return {"Authorization": "Bearer valid-integration-test-token"}
