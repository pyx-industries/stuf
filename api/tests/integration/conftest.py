import pytest
import sys
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
import requests # Import requests to patch it
from api.auth.middleware import get_current_user, User
from api.tests.fixtures.test_data import SAMPLE_TOKEN_RESPONSES, SAMPLE_FILES

@pytest.fixture
def integration_client():
    """TestClient for integration tests - external services are mocked"""
    minio_mock = MagicMock()
    
    # Configure default responses for MinIO mock
    minio_mock.upload_file.return_value = "test/user/file.txt"
    minio_mock.list_objects.return_value = SAMPLE_FILES[:2]  # Return only 2 files as expected
    minio_mock.download_file.return_value = (b"test content", {"original_filename": "test.txt"}, "text/plain")
    minio_mock.get_presigned_url.return_value = "https://minio.example.com/presigned-url"
    minio_mock.delete_object.return_value = True

    # Configure Keycloak token validation mock by simulating a requests.Response
    mock_keycloak_response = MagicMock()
    mock_keycloak_response.status_code = 200
    mock_keycloak_response.json.return_value = SAMPLE_TOKEN_RESPONSES["valid"]
    
    # Patch the MinioClient *class* so that the module-level singleton `minio_client = MinioClient()`
    # in api.storage.minio gets our mock instance when it's imported.
    # This automatically propagates to api.routers.files which imports this singleton.
    with patch('api.storage.minio.MinioClient', return_value=minio_mock), \
         patch('requests.post', return_value=mock_keycloak_response):
        
        # Import app *after* mocks are set up to ensure they are active
        from api.main import app
        client = TestClient(app)
        
        # Attach mocks to the client for easy access and assertions in tests
        client.minio_mock = minio_mock
        client.keycloak_post_mock = mock_keycloak_response
        
        yield client

@pytest.fixture
def mock_external_services(integration_client):
    """Access to the mocked external services from integration_client"""
    return {
        'minio': integration_client.minio_mock,
        'keycloak': integration_client.keycloak_post_mock
    }

@pytest.fixture
def authenticated_headers():
    """Headers with valid authentication token for integration tests"""
    return {"Authorization": "Bearer valid-integration-test-token"}
