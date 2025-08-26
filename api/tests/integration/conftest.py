import pytest
import sys
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
import requests # Import requests to patch it
from api.auth.middleware import get_current_user, User
from api.tests.fixtures.test_data import SAMPLE_TOKEN_RESPONSES, SAMPLE_FILES

@pytest.fixture
def integration_client(request):
    """TestClient for integration tests - external services are mocked and the client is setup within the mock context"""
    # Temporarily remove modules from sys.modules to ensure they are re-imported
    # within the patch context. This is crucial for module-level singletons.
    modules_to_reload = ['api.main', 'api.routers.files', 'api.storage.minio']
    original_modules = {}
    for mod_name in modules_to_reload:
        if mod_name in sys.modules:
            original_modules[mod_name] = sys.modules.pop(mod_name)
                                                                                                                                                              
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
    
    # Apply patches - patch the MinioClient class so it returns our mock instance
    with patch('api.storage.minio.MinioClient', return_value=minio_mock), \
         patch('requests.post', return_value=mock_keycloak_response):
        
        # Import app *after* mocks are set up to ensure they are active
        from api.main import app
        # Ensure the minio_client in routers.files also references our mock instance
        from api.routers import files
        files.minio_client = minio_mock
        
        client = TestClient(app)
        
        # Attach mocks to the client for easy access and assertions in tests
        client.minio_mock = minio_mock
        client.keycloak_post_mock = mock_keycloak_response
        
        yield client
                                                                                                                                                              
    # Restore original modules after the test run
    for mod_name, mod in original_modules.items():
        sys.modules[mod_name] = mod

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
