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
def integration_client(mock_jwt_verification):
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
            yield client

    finally:
        # restore original dependency overrides
        app.dependency_overrides.clear()
        app.dependency_overrides.update(original_overrides)


@pytest.fixture
def mock_jwt_verification():
    """Mock JWT verification to return Zitadel-shaped token payloads."""

    def mock_verify_jwt_token(token):
        if token == "valid-integration-test-token":
            return {
                "sub": "testuser-id",
                "preferred_username": "testuser@example.com",
                "email": "testuser@example.com",
                "given_name": "Test",
                "family_name": "User",
                "azp": "abc123-spa-client-id",
                "scope": "openid profile email stuf:access",
                "urn:zitadel:iam:org:project:roles": {
                    "project-participant": {"orgId": "orgDomain"},
                    "collection-test": {"orgId": "orgDomain"},
                },
                "collections": {"test": ["read", "write", "delete"]},
                "aud": ["abc123-spa-client-id", "12345"],
                "iss": "http://localhost:8080",
                "exp": int(time.time()) + 3600,
                "iat": int(time.time()),
            }
        elif token == "admin-integration-test-token":
            return {
                "sub": "admin-id",
                "preferred_username": "admin@example.com",
                "email": "admin@example.com",
                "given_name": "Admin",
                "family_name": "User",
                "azp": "abc123-spa-client-id",
                "scope": "openid profile email stuf:access",
                "urn:zitadel:iam:org:project:roles": {
                    "admin": {"orgId": "orgDomain"},
                    "collection-test": {"orgId": "orgDomain"},
                    "collection-restricted": {"orgId": "orgDomain"},
                },
                "collections": {
                    "test": ["read", "write", "delete"],
                    "restricted": ["read", "write", "delete"],
                },
                "aud": ["abc123-spa-client-id", "12345"],
                "iss": "http://localhost:8080",
                "exp": int(time.time()) + 3600,
                "iat": int(time.time()),
            }
        elif token == "limited-integration-test-token":
            return {
                "sub": "limiteduser-id",
                "preferred_username": "limiteduser@example.com",
                "email": "limiteduser@example.com",
                "given_name": "Limited",
                "family_name": "User",
                "azp": "abc123-spa-client-id",
                "scope": "openid profile email stuf:access",
                "urn:zitadel:iam:org:project:roles": {
                    "project-participant": {"orgId": "orgDomain"},
                },
                "collections": {"other": ["read", "write", "delete"]},
                "aud": ["abc123-spa-client-id", "12345"],
                "iss": "http://localhost:8080",
                "exp": int(time.time()) + 3600,
                "iat": int(time.time()),
            }
        elif token == "service-account-integration-test-token":
            return {
                "sub": "backup-service",
                "azp": "backup-service",
                "client_id": "backup-service",
                "scope": "openid urn:zitadel:iam:org:project:id:12345:aud",
                "urn:zitadel:iam:org:project:roles": {
                    "service": {"orgId": "orgDomain"},
                    "backup-admin": {"orgId": "orgDomain"},
                },
                "collections": {"test": ["read", "write", "delete"]},
                "aud": ["backup-service", "12345"],
                "iss": "http://localhost:8080",
                "exp": int(time.time()) + 3600,
                "iat": int(time.time()),
            }
        elif token == "limited-service-account-integration-test-token":
            return {
                "sub": "limited-service",
                "azp": "limited-service",
                "client_id": "limited-service",
                "scope": "openid urn:zitadel:iam:org:project:id:12345:aud",
                "urn:zitadel:iam:org:project:roles": {
                    "service": {"orgId": "orgDomain"},
                },
                "collections": {"other": ["read", "write", "delete"]},
                "aud": ["limited-service", "12345"],
                "iss": "http://localhost:8080",
                "exp": int(time.time()) + 3600,
                "iat": int(time.time()),
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
