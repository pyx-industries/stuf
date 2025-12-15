import io
import logging

import pytest

from api.tests.fixtures.test_data import SAMPLE_FILES

logger = logging.getLogger(__name__)


# Parameterize authentication types for comprehensive testing
AUTH_FIXTURES = [
    "authenticated_headers",  # User authentication
    "service_account_headers",  # Service account authentication
]

LIMITED_AUTH_FIXTURES = [
    "limited_user_headers",  # Limited user authentication
    "limited_service_account_headers",  # Limited service account authentication
]


@pytest.mark.integration
class TestFilesAPIIntegration:
    """Integration tests that test the full request flow with mocked external services"""

    @pytest.mark.parametrize("auth_fixture", AUTH_FIXTURES)
    def test_upload_file_with_valid_auth(
        self, integration_client, request, auth_fixture
    ):
        """Test file upload with valid authentication (both user and service account)"""
        headers = request.getfixturevalue(auth_fixture)

        # Create test file
        test_content = b"This is integration test content"
        test_file = ("test.txt", io.BytesIO(test_content), "text/plain")

        response = integration_client.post(
            "/api/files/test",
            files={"file": test_file},
            data={
                "metadata": '{"description": "Integration test file"}',
            },
            headers=headers,
        )

        assert response.status_code == 200
        result = response.json()
        assert result["status"] == "success"
        assert "test" in result["object_name"]

        # Verify storage repository was called
        integration_client.storage_repo_mock.store_file.assert_called_once()

    def test_upload_file_without_auth(self, integration_client):
        """Test file upload without authentication"""
        test_file = ("test.txt", io.BytesIO(b"content"), "text/plain")

        response = integration_client.post(
            "/api/files/test",
            files={"file": test_file},
            data={"metadata": "{}"},
        )

        assert response.status_code == 401

    @pytest.mark.parametrize("auth_fixture", LIMITED_AUTH_FIXTURES)
    def test_upload_file_wrong_collection(
        self, integration_client, request, auth_fixture
    ):
        """Test file upload to unauthorized collection (both user and service account)"""
        headers = request.getfixturevalue(auth_fixture)
        test_file = ("test.txt", io.BytesIO(b"content"), "text/plain")

        response = integration_client.post(
            "/api/files/test",
            files={"file": test_file},
            data={"metadata": "{}"},
            headers=headers,  # Limited auth only has access to "other" collection, not "test"
        )

        assert response.status_code == 403
        assert (
            "don't have" in response.json()["detail"]
            and "access to collection" in response.json()["detail"]
        )

        # Ensure storage repository was *not* called because of permission error
        integration_client.storage_repo_mock.store_file.assert_not_called()

    @pytest.mark.parametrize("auth_fixture", AUTH_FIXTURES)
    def test_list_files_with_valid_auth(
        self, integration_client, request, auth_fixture
    ):
        """Test file listing with valid authentication (both user and service account)"""
        headers = request.getfixturevalue(auth_fixture)

        response = integration_client.get("/api/files/test", headers=headers)

        assert response.status_code == 200
        result = response.json()
        assert result["status"] == "success"
        assert result["collection"] == "test"
        assert len(result["files"]) == len(SAMPLE_FILES[:2])

        # Verify MinIO list was called with correct prefix
        integration_client.storage_repo_mock.list_files_in_collection.assert_called_once_with(
            "test"
        )

    def test_list_files_without_auth(self, integration_client):
        """Test file listing without authentication"""
        response = integration_client.get("/api/files/test")

        assert response.status_code == 401

    @pytest.mark.parametrize("auth_fixture", AUTH_FIXTURES)
    def test_download_file_with_valid_auth(
        self, integration_client, request, auth_fixture
    ):
        """Test file download with valid authentication (both user and service account)"""
        headers = request.getfixturevalue(auth_fixture)

        # The mock is already configured in conftest.py to return appropriate values

        response = integration_client.get(
            "/api/files/test/user/test.txt", headers=headers
        )

        assert response.status_code == 200
        assert response.content == b"test content"  # From conftest mock
        assert "text/plain" in response.headers["content-type"]

        # Verify storage repository download was called
        integration_client.storage_repo_mock.retrieve_file.assert_called_once_with(
            "test/user/test.txt"
        )

    @pytest.mark.parametrize("auth_fixture", AUTH_FIXTURES)
    def test_invalid_metadata_format(self, integration_client, request, auth_fixture):
        """Test upload with invalid metadata JSON (both user and service account)"""
        headers = request.getfixturevalue(auth_fixture)
        test_file = ("test.txt", io.BytesIO(b"content"), "text/plain")

        response = integration_client.post(
            "/api/files/test",
            files={"file": test_file},
            data={"metadata": "invalid json"},
            headers=headers,
        )

        assert response.status_code == 400
        assert "Invalid metadata JSON format" in response.json()["detail"]

    @pytest.mark.parametrize("auth_fixture", AUTH_FIXTURES)
    def test_delete_file_with_valid_auth(
        self, integration_client, request, auth_fixture
    ):
        """Test file deletion with valid authentication (both user and service account)"""
        headers = request.getfixturevalue(auth_fixture)

        # Configure mock to simulate successful deletion - already configured in conftest.py

        response = integration_client.delete(
            "/api/files/test/user/test-file.txt", headers=headers
        )

        assert response.status_code == 200
        result = response.json()
        assert result["status"] == "success"
        assert result["message"] == "File deleted successfully"

        # Verify storage repository delete was called with correct object name
        integration_client.storage_repo_mock.delete_file.assert_called_once_with(
            "test/user/test-file.txt"
        )

    def test_delete_file_without_auth(self, integration_client):
        """Test file deletion without authentication"""
        response = integration_client.delete("/api/files/test/user/test-file.txt")

        assert response.status_code == 401

    @pytest.mark.parametrize("auth_fixture", LIMITED_AUTH_FIXTURES)
    def test_delete_file_wrong_collection_permission(
        self, integration_client, request, auth_fixture
    ):
        """Test file deletion without delete permission for collection (both user and service account)"""
        headers = request.getfixturevalue(auth_fixture)

        response = integration_client.delete(
            "/api/files/test/user/test-file.txt",
            headers=headers,  # Limited auth only has access to "other" collection, not "test"
        )

        assert response.status_code == 403
        assert "don't have delete access to collection" in response.json()["detail"]

        # Ensure storage repository was *not* called because of permission error
        integration_client.storage_repo_mock.delete_file.assert_not_called()

    @pytest.mark.parametrize("auth_fixture", AUTH_FIXTURES)
    def test_delete_file_storage_error(self, integration_client, request, auth_fixture):
        """Test file deletion with storage error (both user and service account)"""
        headers = request.getfixturevalue(auth_fixture)

        # Configure storage repository mock to simulate storage error
        from domain.repositories import StorageError

        integration_client.storage_repo_mock.file_exists.return_value = (
            True  # File exists, but delete fails
        )
        integration_client.storage_repo_mock.delete_file.side_effect = StorageError(
            "Storage error"
        )

        response = integration_client.delete(
            "/api/files/test/user/test-file.txt", headers=headers
        )

        assert response.status_code == 500
        assert "Storage error during deletion" in response.json()["detail"]
        assert "Storage error" in response.json()["detail"]

    @pytest.mark.parametrize(
        "auth_fixture,expected_type",
        [
            ("authenticated_headers", "user"),
            ("service_account_headers", "service_account"),
        ],
    )
    def test_me_endpoint_response_format(
        self, integration_client, request, auth_fixture, expected_type
    ):
        """Test /api/me endpoint returns correct response format for users vs service accounts"""
        headers = request.getfixturevalue(auth_fixture)

        response = integration_client.get("/api/me", headers=headers)

        assert response.status_code == 200
        result = response.json()
        assert result["type"] == expected_type

        if expected_type == "user":
            # User response should have username, email, full_name
            assert "username" in result
            assert "email" in result
            assert "full_name" in result
            assert "client_id" not in result
            assert "scopes" not in result
        elif expected_type == "service_account":
            # Service account response should have client_id, name, scopes
            assert "client_id" in result
            assert "name" in result
            assert "scopes" in result
            assert "username" not in result
            assert "email" not in result

        # Both should have common fields
        assert "roles" in result
        assert "collections" in result
        assert "active" in result
