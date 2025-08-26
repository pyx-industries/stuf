import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
import requests # Import requests to patch it
from api.auth.middleware import get_current_user, User
from api.tests.fixtures.test_data import SAMPLE_TOKEN_RESPONSES, SAMPLE_FILES
from api.routers.files import get_minio_client
from api.main import app # Import app here for dependency override
from api.storage.minio import MinioClient # Import MinioClient for spec

@pytest.fixture(scope="module")
def mock_keycloak_requests():
    """Mocks requests.post for Keycloak token validation."""
    mock_keycloak_response = MagicMock()
    mock_keycloak_response.status_code = 200
    mock_keycloak_response.json.return_value = SAMPLE_TOKEN_RESPONSES["valid"]

    with patch('requests.post', return_value=mock_keycloak_response) as mock_post:
        yield mock_post

@pytest.fixture(scope="module")
def integration_client_setup(mock_keycloak_requests):
    """
    Setup function for integration tests to configure dependency overrides.
    This runs once per module.
    """
    minio_mock_for_assertions = MagicMock(spec=MinioClient)
    minio_mock_for_assertions.upload_file.return_value = "test/user/file.txt"
    minio_mock_for_assertions.list_objects.return_value = SAMPLE_FILES[:2]
    minio_mock_for_assertions.download_file.return_value = (b"test content", {"original_filename": "test.txt"}, "text/plain")
    minio_mock_for_assertions.get_presigned_url.return_value = "https://minio.example.com/presigned-url"
    minio_mock_for_assertions.delete_object.return_value = True

    default_test_user = User(
        username="testuser",
        email="testuser@example.com",
        full_name="Test User",
        roles=["user", "collection-test"],
        active=True
    )

    # Store original overrides to restore them after the module's tests
    original_minio_override = app.dependency_overrides.get(get_minio_client)
    original_user_override = app.dependency_overrides.get(get_current_user)

    app.dependency_overrides[get_minio_client] = lambda: minio_mock_for_assertions
    app.dependency_overrides[get_current_user] = lambda: default_test_user

    yield {
        "minio_mock": minio_mock_for_assertions,
        "keycloak_post_mock": mock_keycloak_requests,
        "current_user_mock": default_test_user
    }

    # Teardown: Restore original dependency overrides
    if original_minio_override:
        app.dependency_overrides[get_minio_client] = original_minio_override
    else:
        app.dependency_overrides.pop(get_minio_client, None)
    
    if original_user_override:
        app.dependency_overrides[get_current_user] = original_user_override
    else:
        app.dependency_overrides.pop(get_current_user, None)

@pytest.fixture
def integration_client(integration_client_setup):
    """
    TestClient for integration tests. Uses app with overrides set by integration_client_setup.
    This fixture ensures a fresh TestClient instance for each test function,
    but the app-level overrides are shared per module.
    """
    client = TestClient(app)
    client.minio_mock = integration_client_setup["minio_mock"]
    client.keycloak_post_mock = integration_client_setup["keycloak_post_mock"]
    client.current_user_mock = integration_client_setup["current_user_mock"]
    return client

@pytest.fixture
def mock_external_services(integration_client_setup):
    """Access to the mocked external services from integration_client_setup"""
    return {
        'minio': integration_client_setup["minio_mock"],
        'keycloak': integration_client_setup["keycloak_post_mock"]
    }

@pytest.fixture
def authenticated_headers():
    """Headers with valid authentication token for integration tests"""
    return {"Authorization": "Bearer valid-integration-test-token"}
