import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
import requests # Import requests to patch it
from api.auth.middleware import get_current_user, User
from api.tests.fixtures.test_data import SAMPLE_TOKEN_RESPONSES, SAMPLE_FILES
from api.routers.files import get_minio_client
from api.main import app # Import app here for dependency override
from api.storage.minio import MinioClient # Import MinioClient for spec

@pytest.fixture
def mock_keycloak_requests():
    """Mocks requests.post for Keycloak token validation."""
    mock_keycloak_response = MagicMock()
    mock_keycloak_response.status_code = 200
    mock_keycloak_response.json.return_value = SAMPLE_TOKEN_RESPONSES["valid"]

    with patch('requests.post', return_value=mock_keycloak_response) as mock_post:
        yield mock_post

@pytest.fixture
def integration_client(request, mock_keycloak_requests): # Depend only on mock_keycloak_requests
    """TestClient for integration tests with mocked external services."""
    # Create the mock MinioClient instance
    minio_mock_for_assertions = MagicMock(spec=MinioClient)
    minio_mock_for_assertions.upload_file.return_value = "test/user/file.txt"
    minio_mock_for_assertions.list_objects.return_value = SAMPLE_FILES[:2]
    minio_mock_for_assertions.download_file.return_value = (b"test content", {"original_filename": "test.txt"}, "text/plain")
    minio_mock_for_assertions.get_presigned_url.return_value = "https://minio.example.com/presigned-url"
    minio_mock_for_assertions.delete_object.return_value = True

    # Create a default mock user for get_current_user
    default_test_user = User(
        username="testuser",
        email="testuser@example.com",
        full_name="Test User",
        roles=["user", "collection-test"],
        active=True
    )

    # Store original overrides to restore them after the test
    original_overrides = app.dependency_overrides.copy()

    # Set dependency overrides for this test run
    app.dependency_overrides[get_minio_client] = lambda: minio_mock_for_assertions
    app.dependency_overrides[get_current_user] = lambda: default_test_user # Set default user override here

    client = TestClient(app)
    
    # Attach our assertion mocks to the client for easy access in tests
    client.minio_mock = minio_mock_for_assertions
    client.keycloak_post_mock = mock_keycloak_requests # Attach the mock from the fixture
    client.current_user_mock = default_test_user # Attach the default mock user
    
    yield client
    
    # Teardown: Restore all original dependency overrides
    app.dependency_overrides = original_overrides

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
