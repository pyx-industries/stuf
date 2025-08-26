import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from api.main import app
from api.tests.fixtures.test_data import SAMPLE_TOKEN_RESPONSES, SAMPLE_FILES

@pytest.fixture
def mock_external_services():
    """Mock external services for integration tests - mocks HTTP calls to external services"""
    minio_mock = MagicMock()
    
    with patch('api.storage.minio.minio_client', minio_mock), \
         patch('requests.post') as keycloak_mock:
        
        # Configure Keycloak HTTP mock
        keycloak_mock.return_value.status_code = 200
        keycloak_mock.return_value.json.return_value = SAMPLE_TOKEN_RESPONSES["valid"]
        
        # Configure MinIO service mock
        minio_mock.upload_file.return_value = "test/user/file.txt"
        minio_mock.list_objects.return_value = SAMPLE_FILES
        minio_mock.download_file.return_value = (b"test content", {"original_filename": "test.txt"}, "text/plain")
        minio_mock.get_presigned_url.return_value = "https://minio.example.com/presigned-url"
        
        yield {
            'minio': minio_mock,
            'keycloak': keycloak_mock
        }

@pytest.fixture
def integration_client():
    """TestClient for integration tests - external services are mocked"""
    return TestClient(app)

@pytest.fixture
def authenticated_headers():
    """Headers with valid authentication token for integration tests"""
    return {"Authorization": "Bearer valid-integration-test-token"}
