import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
import requests # Import requests to patch it
from api.auth.middleware import get_current_user, User, validate_token
from api.tests.fixtures.test_data import SAMPLE_TOKEN_RESPONSES, SAMPLE_FILES, SAMPLE_USERS
from api.main import app # Import app here for dependency override
from api.storage.minio import MinioClient # Import MinioClient for spec

import logging

logger = logging.getLogger(__name__)

@pytest.fixture
def mock_keycloak_requests():
    """Mocks requests.post for Keycloak token validation (function-scoped)."""
    mock_keycloak_response = MagicMock()
    mock_keycloak_response.status_code = 200
    mock_keycloak_response.json.return_value = SAMPLE_TOKEN_RESPONSES["valid"]

    with patch('requests.post', return_value=mock_keycloak_response) as mock_post:
        yield mock_post

@pytest.fixture
def integration_client(mock_keycloak_requests):
    """
    TestClient for integration tests. This fixture is function-scoped,
    meaning a fresh TestClient instance and its associated app.dependency_overrides
    are set up for each test function.
    """
    # Store original overrides to restore them after the test
    original_overrides = app.dependency_overrides.copy() 

    try:
        minio_mock_for_assertions = MagicMock() # Removed spec=MinioClient to ensure direct mock behavior
        logger.debug(f"Fixture created minio_mock_for_assertions: {minio_mock_for_assertions} (ID: {id(minio_mock_for_assertions)})")
        minio_mock_for_assertions.upload_file.return_value = "test/user/file.txt"
        minio_mock_for_assertions.list_objects.return_value = SAMPLE_FILES[:2]
        minio_mock_for_assertions.download_file.return_value = (b"test content", {"original_filename": "test.txt"}, "text/plain")
        minio_mock_for_assertions.get_presigned_url.return_value = "https://minio.example.com/presigned-url"
        minio_mock_for_assertions.delete_object.return_value = True

        # Patch the MinioClient class directly to ensure all instantiations get the mock
        with patch.object(MinioClient, '__new__', return_value=minio_mock_for_assertions):
            mock_user_instance = User(
                username="testuser",
                email="testuser@example.com",
                full_name="Test User",
                roles=["user", "collection-test"],
                active=True
            )

            mock_get_current_user_dep = MagicMock(return_value=mock_user_instance)
            # Also patch validate_token to avoid real Keycloak calls
            with patch.object(validate_token, '__wrapped__', return_value=SAMPLE_TOKEN_RESPONSES["valid"]):
                app.dependency_overrides[get_current_user] = mock_get_current_user_dep

                with TestClient(app) as client:
                    client.minio_mock = minio_mock_for_assertions                                                                                                                                                          
                    client.keycloak_post_mock = mock_keycloak_requests
                    client.current_user_mock = mock_user_instance

                    yield client

            
            yield client
            
    except Exception as e:
        print(f"Error creating TestClient: {e}")
        raise
    finally:
        # restore original dependency overrides
        app.dependency_overrides.clear()
        app.dependency_overrides.update(original_overrides) 


@pytest.fixture
def authenticated_headers():
    """Headers with valid authentication token for integration tests"""
    return {"Authorization": "Bearer valid-integration-test-token"}
