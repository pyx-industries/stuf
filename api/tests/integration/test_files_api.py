import logging
import pytest
import io

from api.tests.fixtures.test_data import SAMPLE_FILES

logger = logging.getLogger(__name__)


@pytest.mark.integration
class TestFilesAPIIntegration:
    """Integration tests that test the full request flow with mocked external services"""

    def test_upload_file_with_valid_auth(
        self, integration_client, authenticated_headers
    ):
        """Test file upload with valid authentication"""
        # Create test file
        test_content = b"This is integration test content"
        test_file = ("test.txt", io.BytesIO(test_content), "text/plain")

        response = integration_client.post(
            "/api/files/upload",
            files={"file": test_file},
            data={
                "collection": "test",
                "metadata": '{"description": "Integration test file"}',
            },
            headers=authenticated_headers,
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
            "/api/files/upload",
            files={"file": test_file},
            data={"collection": "test", "metadata": "{}"},
        )

        assert response.status_code == 401

    def test_upload_file_wrong_collection(
        self, integration_client, limited_user_headers
    ):
        """Test file upload to unauthorized collection"""
        test_file = ("test.txt", io.BytesIO(b"content"), "text/plain")

        response = integration_client.post(
            "/api/files/upload",
            files={"file": test_file},
            data={"collection": "test", "metadata": "{}"},
            headers=limited_user_headers,  # User only has access to "other" collection, not "test"
        )

        assert response.status_code == 403
        assert (
            "don't have" in response.json()["detail"]
            and "access to collection" in response.json()["detail"]
        )

        # Ensure storage repository was *not* called because of permission error
        integration_client.storage_repo_mock.store_file.assert_not_called()

    def test_list_files_with_valid_auth(
        self, integration_client, authenticated_headers
    ):
        """Test file listing with valid authentication"""
        response = integration_client.get(
            "/api/files/list/test", headers=authenticated_headers
        )

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
        response = integration_client.get("/api/files/list/test")

        assert response.status_code == 401

    def test_download_file_with_valid_auth(
        self, integration_client, authenticated_headers
    ):
        """Test file download with valid authentication"""
        # The mock is already configured in conftest.py to return appropriate values

        response = integration_client.get(
            "/api/files/download/test/user/test.txt", headers=authenticated_headers
        )

        assert response.status_code == 200
        assert response.content == b"test content"  # From conftest mock
        assert "text/plain" in response.headers["content-type"]

        # Verify storage repository download was called
        integration_client.storage_repo_mock.retrieve_file.assert_called_once_with(
            "test/user/test.txt"
        )

    def test_invalid_metadata_format(self, integration_client, authenticated_headers):
        """Test upload with invalid metadata JSON"""
        test_file = ("test.txt", io.BytesIO(b"content"), "text/plain")

        response = integration_client.post(
            "/api/files/upload",
            files={"file": test_file},
            data={"collection": "test", "metadata": "invalid json"},
            headers=authenticated_headers,
        )

        assert response.status_code == 400
        assert "Invalid metadata JSON format" in response.json()["detail"]

    def test_delete_file_with_valid_auth(
        self, integration_client, authenticated_headers
    ):
        """Test file deletion with valid authentication"""
        # Configure mock to simulate successful deletion - already configured in conftest.py

        response = integration_client.delete(
            "/api/files/test/user/test-file.txt", headers=authenticated_headers
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

    def test_delete_file_wrong_collection_permission(
        self, integration_client, limited_user_headers
    ):
        """Test file deletion without delete permission for collection"""
        response = integration_client.delete(
            "/api/files/test/user/test-file.txt",
            headers=limited_user_headers,  # User only has access to "other" collection, not "test"
        )

        assert response.status_code == 403
        assert "don't have delete access to collection" in response.json()["detail"]

        # Ensure storage repository was *not* called because of permission error
        integration_client.storage_repo_mock.delete_file.assert_not_called()

    def test_delete_file_storage_error(self, integration_client, authenticated_headers):
        """Test file deletion with storage error"""
        # Configure storage repository mock to simulate storage error
        from domain.repositories import StorageError

        integration_client.storage_repo_mock.file_exists.return_value = (
            True  # File exists, but delete fails
        )
        integration_client.storage_repo_mock.delete_file.side_effect = StorageError(
            "Storage error"
        )

        response = integration_client.delete(
            "/api/files/test/user/test-file.txt", headers=authenticated_headers
        )

        assert response.status_code == 500
        assert "Storage error during deletion" in response.json()["detail"]
        assert "Storage error" in response.json()["detail"]
