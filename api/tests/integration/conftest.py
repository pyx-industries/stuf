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
def mock_auth_user_dependency(request):
    """Provides a default mock user and sets up dependency override for get_current_user."""
    test_user = User(
        username="testuser",
        email="testuser@example.com",
        full_name="Test User",
        roles=["user", "collection-test"],
        active=True
    )
    
    original_get_current_user_override = app.dependency_overrides.get(get_current_user)
    app.dependency_overrides[get_current_user] = lambda: test_user

    yield test_user

    if original_get_current_user_override:
        app.dependency_overrides[get_current_user] = original_get_current_user_override
    else:
        app.dependency_overrides.pop(get_current_user, None)

@pytest.fixture
def integration_client(request, mock_keycloak_requests, mock_auth_user_dependency): # Depend on both new fixtures
    """TestClient for integration tests with mocked external services."""
    minio_mock_for_assertions = MagicMock(spec=MinioClient) # Use spec for type-consistent mocking
    
    # Configure default responses for the MinioClient mock instance
    minio_mock_for_assertions.upload_file.return_value = "test/user/file.txt"
    minio_mock_for_assertions.list_objects.return_value = SAMPLE_FILES[:2]  # Return only 2 files as expected
    minio_mock_for_assertions.download_file.return_value = (b"test content", {"original_filename": "test.txt"}, "text/plain")
    minio_mock_for_assertions.get_presigned_url.return_value = "https://minio.example.com/presigned-url"
    minio_mock_for_assertions.delete_object.return_value = True

    # Use the mock from mock_keycloak_requests for requests.post
    # mock_keycloak_response = mock_keycloak_requests # This line is no longer strictly needed as mock_keycloak_requests handles the patch
    
    # Store original MinIO override to restore it after the test
    original_minio_override = app.dependency_overrides.get(get_minio_client)

    # Set dependency override for MinioClient
    app.dependency_overrides[get_minio_client] = lambda: minio_mock_for_assertions
    
    client = TestClient(app)
    
    # Attach our assertion mocks to the client for easy access in tests
    client.minio_mock = minio_mock_for_assertions
    client.keycloak_post_mock = mock_keycloak_requests # Attach the mock from the fixture
    client.current_user_mock = mock_auth_user_dependency # Attach the mock user
    
    yield client
    
    # Teardown: Restore original dependency override for MinioClient
    if original_minio_override:
        app.dependency_overrides[get_minio_client] = original_minio_override
    else:
        app.dependency_overrides.pop(get_minio_client, None)
    
    # The get_current_user override is managed by mock_auth_user_dependency fixture's teardown

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
