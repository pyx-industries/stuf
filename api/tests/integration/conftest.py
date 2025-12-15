import json
import time
from unittest.mock import MagicMock, patch

import pytest
from domain.repositories import StorageRepository
from fastapi.testclient import TestClient
from infrastructure.container import get_storage_repository

from api.main import app  # Import app here for dependency override
from api.tests.fixtures.test_data import (
    SAMPLE_FILES,
    SAMPLE_TOKEN_RESPONSES,
)


@pytest.fixture
def mock_keycloak_requests():
    """Mocks requests.post for Keycloak token validation (function-scoped)."""
    mock_keycloak_response = MagicMock()
    mock_keycloak_response.status_code = 200
    mock_keycloak_response.json.return_value = SAMPLE_TOKEN_RESPONSES["valid"]

    with patch("requests.post", return_value=mock_keycloak_response) as mock_post:
        yield mock_post


@pytest.fixture
def integration_client(mock_keycloak_requests, mock_jwt_verification):
    """
    TestClient for integration tests. This fixture is function-scoped,
    meaning a fresh TestClient instance and its associated app.dependency_overrides
    are set up for each test function.
    """
    # Store original overrides to restore them after the test
    original_overrides = app.dependency_overrides.copy()

    try:
        # Create mock StorageRepository that implements the protocol
        storage_repo_mock = MagicMock(spec=StorageRepository)

        # Configure the mock to return appropriate values for each protocol method
        storage_repo_mock.store_file.return_value = True
        storage_repo_mock.list_files_in_collection.return_value = [
            # Mock File objects using the sample data
            MagicMock(
                object_name=file_data["name"],
                collection=file_data["name"].split("/")[0],
                owner=file_data["name"].split("/")[1]
                if "/" in file_data["name"]
                else "testuser",
                original_filename=file_data["name"].split("-", 1)[-1]
                if "-" in file_data["name"]
                else file_data["name"],
                upload_time="20250101-120000",
                content_type="text/plain",
                size=file_data["size"],
                metadata={},
                to_api_dict=lambda: {
                    "object_name": file_data["name"],
                    "collection": file_data["name"].split("/")[0],
                    "owner": file_data["name"].split("/")[1]
                    if "/" in file_data["name"]
                    else "testuser",
                    "original_filename": file_data["name"].split("-", 1)[-1]
                    if "-" in file_data["name"]
                    else file_data["name"],
                    "upload_time": "20250101-120000",
                    "content_type": "text/plain",
                    "size": file_data["size"],
                    "metadata": {},
                },
            )
            for file_data in SAMPLE_FILES[:2]
        ]
        from io import BytesIO

        from domain.models import File

        storage_repo_mock.retrieve_file.return_value = (
            BytesIO(b"test content"),
            File(
                object_name="test/user/test.txt",
                collection="test",
                owner="user",
                original_filename="test.txt",
                upload_time="20250101-120000",
                content_type="text/plain",
                size=12,
                metadata={"original_filename": "test.txt"},
            ),
        )
        storage_repo_mock.delete_file.return_value = True
        storage_repo_mock.file_exists.return_value = True

        # Override dependencies for StorageRepository
        app.dependency_overrides[get_storage_repository] = lambda: storage_repo_mock

        with TestClient(app) as client:
            client.storage_repo_mock = storage_repo_mock
            client.keycloak_post_mock = mock_keycloak_requests
            yield client

    finally:
        # restore original dependency overrides
        app.dependency_overrides.clear()
        app.dependency_overrides.update(original_overrides)


@pytest.fixture
def mock_jwt_verification():
    """Mock JWT verification to avoid needing real Keycloak keys"""

    def mock_verify_jwt_token(token):
        if token == "valid-integration-test-token":
            # Return a valid token payload for test user
            return {
                "sub": "testuser",
                "preferred_username": "testuser",
                "email": "testuser@example.com",
                "name": "Test User",
                "realm_access": {"roles": ["user", "collection-test"]},
                "collections": json.dumps({"test": ["read", "write", "delete"]}),
                "aud": ["stuf-api"],
                "iss": "http://localhost:8080/realms/stuf",
                "exp": int(time.time()) + 3600,  # Valid for 1 hour
                "iat": int(time.time()),
            }
        elif token == "admin-integration-test-token":
            # Return a valid token payload for admin user
            return {
                "sub": "admin",
                "preferred_username": "admin",
                "email": "admin@example.com",
                "name": "Admin User",
                "realm_access": {
                    "roles": ["admin", "collection-test", "collection-restricted"]
                },
                "collections": json.dumps(
                    {
                        "test": ["read", "write", "delete"],
                        "restricted": ["read", "write", "delete"],
                    }
                ),
                "aud": ["stuf-api"],
                "iss": "http://localhost:8080/realms/stuf",
                "exp": int(time.time()) + 3600,
                "iat": int(time.time()),
            }
        elif token == "limited-integration-test-token":
            # Return a valid token payload for limited user (only has access to "other" collection, not "test")
            return {
                "sub": "limiteduser",
                "preferred_username": "limiteduser",
                "email": "limiteduser@example.com",
                "name": "Limited User",
                "realm_access": {"roles": ["user", "collection-other"]},
                "collections": json.dumps(
                    {"other": ["read", "write", "delete"]}
                ),  # No access to "test" collection
                "aud": ["stuf-api"],
                "iss": "http://localhost:8080/realms/stuf",
                "exp": int(time.time()) + 3600,
                "iat": int(time.time()),
            }
        elif token == "service-account-integration-test-token":
            # Return a valid token payload for service account
            return {
                "sub": "service-account-backup",
                "azp": "backup-service",  # Service account identifier
                "client_id": "backup-service",
                "name": "Backup Service Account",
                "description": "Service account for integration tests",
                "realm_access": {"roles": ["service", "backup-admin"]},
                "collections": json.dumps({"test": ["read", "write", "delete"]}),
                "scope": "read write delete",
                "aud": ["stuf-api"],
                "iss": "http://localhost:8080/realms/stuf",
                "exp": int(time.time()) + 3600,
                "iat": int(time.time()),
                # No preferred_username - this makes it a service account token
            }
        elif token == "limited-service-account-integration-test-token":
            # Return a valid token payload for limited service account (only has access to "other" collection)
            return {
                "sub": "service-account-limited",
                "azp": "limited-service",
                "client_id": "limited-service",
                "name": "Limited Service Account",
                "description": "Limited service account for integration tests",
                "realm_access": {"roles": ["service"]},
                "collections": json.dumps(
                    {"other": ["read", "write", "delete"]}
                ),  # No access to "test" collection
                "scope": "read write delete",
                "aud": ["stuf-api"],
                "iss": "http://localhost:8080/realms/stuf",
                "exp": int(time.time()) + 3600,
                "iat": int(time.time()),
                # No preferred_username - this makes it a service account token
            }
        return None

    with patch("auth.middleware.verify_jwt_token", side_effect=mock_verify_jwt_token):
        yield


@pytest.fixture
def authenticated_headers():
    """Headers with valid authentication token for integration tests"""
    return {"Authorization": "Bearer valid-integration-test-token"}


@pytest.fixture
def admin_headers():
    """Headers with valid admin authentication token for integration tests"""
    return {"Authorization": "Bearer admin-integration-test-token"}


@pytest.fixture
def limited_user_headers():
    """Headers with limited user authentication token (no access to test collection)"""
    return {"Authorization": "Bearer limited-integration-test-token"}


@pytest.fixture
def service_account_headers():
    """Headers with service account authentication token"""
    return {"Authorization": "Bearer service-account-integration-test-token"}


@pytest.fixture
def limited_service_account_headers():
    """Headers with limited service account authentication token (no access to test collection)"""
    return {"Authorization": "Bearer limited-service-account-integration-test-token"}
