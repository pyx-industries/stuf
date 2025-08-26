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

    # This mock prevents actual Minio connections when MinioClient.__init__ runs
    # by replacing the external 'Minio' class it tries to instantiate.
    minio_raw_class_mock = MagicMock()
    # Ensure bucket_exists and make_bucket methods on the internal Minio client mock
    # don't cause errors if called during MinioClient's init.
    minio_raw_class_mock.return_value.bucket_exists.return_value = True
    minio_raw_class_mock.return_value.make_bucket.return_value = None

    # Configure Keycloak token validation mock
    mock_keycloak_response = MagicMock()
    mock_keycloak_response.status_code = 200
    mock_keycloak_response.json.return_value = SAMPLE_TOKEN_RESPONSES["valid"]
    
    # Patch the actual 'Minio' class used internally by MinioClient
    # And then patch the module-level 'minio_client' singletons with our assertion mock.
    with patch('api.storage.minio.Minio', minio_raw_class_mock), \
         patch('api.storage.minio.minio_client', minio_mock_for_assertions), \
         patch('api.routers.files.minio_client', minio_mock_for_assertions), \
         patch('requests.post', return_value=mock_keycloak_response):
        
        # Import app *after* mocks are set up to ensure they are active
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
