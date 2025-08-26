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
    minio_mock_for_assertions = MagicMock()
    
    # Configure default responses for the MinioClient mock used for assertions
    minio_mock_for_assertions.upload_file.return_value = "test/user/file.txt"
    minio_mock_for_assertions.list_objects.return_value = SAMPLE_FILES[:2]  # Return only 2 files as expected
    minio_mock_for_assertions.download_file.return_value = (b"test content", {"original_filename": "test.txt"}, "text/plain")
    minio_mock_for_assertions.get_presigned_url.return_value = "https://minio.example.com/presigned-url"
    minio_mock_for_assertions.delete_object.return_value = True

    # Configure Keycloak token validation mock
    mock_keycloak_response = MagicMock()
    mock_keycloak_response.status_code = 200
    mock_keycloak_response.json.return_value = SAMPLE_TOKEN_RESPONSES["valid"]
    
    # Patch MinioClient.__init__ to do nothing, preventing any real Minio object creation or bucket checks.
    # Then explicitly patch the module-level 'minio_client' singletons with our assertion mock.
    with patch('api.storage.minio.MinioClient.__init__', return_value=None), \
         patch('api.storage.minio.minio_client', minio_mock_for_assertions), \
         patch('api.routers.files.minio_client', minio_mock_for_assertions), \
         patch('requests.post', return_value=mock_keycloak_response):
        
        # Import app *after* mocks are set up to ensure they are active.
        # This will trigger the MinioClient() in api.storage.minio, but its __init__ is now mocked.
        from api.main import app
        client = TestClient(app)
        
        # Attach our assertion mock to the client for easy access in tests
        client.minio_mock = minio_mock_for_assertions
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
