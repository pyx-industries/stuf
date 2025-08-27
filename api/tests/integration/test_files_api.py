import logging
import pytest
import io
import json
from fastapi.testclient import TestClient
from unittest.mock import patch

from api.main import app
from api.tests.fixtures.test_data import SAMPLE_FILES

logger = logging.getLogger(__name__)

@pytest.mark.integration
class TestFilesAPIIntegration:
    """Integration tests that test the full request flow with mocked external services"""
    
    def test_upload_file_with_valid_auth(self, integration_client, authenticated_headers):
        """Test file upload with valid authentication"""
        from api.routers.files import get_minio_client

        # DEBUG: Verify mock setup
        logger.info(f"MinIO mock type: {type(integration_client.minio_mock)}")
        logger.info(f"MinIO mock upload_file: {integration_client.minio_mock.upload_file}")
        logger.info(f"Upload_file call count before: {integration_client.minio_mock.upload_file.call_count}")

        # DEBUG: Check if dependency override is active
        logger.info(f"App dependency overrides: {app.dependency_overrides}")
        logger.info(f"get_minio_client in overrides: {get_minio_client in app.dependency_overrides}")

        if get_minio_client in app.dependency_overrides:
            actual_client = app.dependency_overrides[get_minio_client]()
            logger.info(f"Overridden client type: {type(actual_client)}")
            logger.info(f"Is it our mock? {actual_client is integration_client.minio_mock}")

        # Create test file
        test_content = b"This is integration test content"
        test_file = ("test.txt", io.BytesIO(test_content), "text/plain")
        

        try:
            response = integration_client.post(
                "/api/files/upload",
                files={"file": test_file},
                data={
                    "collection": "test",
                    "metadata": '{"description": "Integration test file"}'
                },
                headers=authenticated_headers
            )
        except Exception as e:
            logger.error(f"Exception during request: {e}")
            raise

        # DEBUG: Print response details
        logger.info(f"Response status: {response.status_code}")
        logger.info(f"Response content: {response.content}")
        if response.status_code == 200:
            logger.info(f"Response JSON: {response.json()}")
        else:
            logger.warning("Response was not 200, cannot parse JSON")

        # DEBUG: Check call count after
        logger.info(f"Upload_file call count after: {integration_client.minio_mock.upload_file.call_count}")
        logger.info(f"All calls made: {integration_client.minio_mock.method_calls}")

        
        assert response.status_code == 200
        result = response.json()
        assert result["status"] == "success"
        assert "test" in result["object_name"]

        
        # Verify MinIO upload was called
        integration_client.minio_mock.upload_file.assert_called_once()

    def test_upload_file_without_auth(self, integration_client):
        """Test file upload without authentication"""
        test_file = ("test.txt", io.BytesIO(b"content"), "text/plain")
        
        response = integration_client.post(
            "/api/files/upload",
            files={"file": test_file},
            data={"collection": "test", "metadata": "{}"}
        )
        
        assert response.status_code == 401

    def test_upload_file_wrong_collection(self, integration_client, authenticated_headers):
        """Test file upload to unauthorized collection"""
        # Configure the mock user for this specific test to have limited roles
        integration_client.current_user_mock.roles = ["user", "collection-other"]
        integration_client.current_user_mock.username = "limiteduser" # Also update username for consistent logging/object_name
        
        test_file = ("test.txt", io.BytesIO(b"content"), "text/plain")
        
        response = integration_client.post(
            "/api/files/upload",
            files={"file": test_file},
            data={"collection": "test", "metadata": "{}"},
            headers=authenticated_headers # Use the default authenticated headers
        )
        
        assert response.status_code == 403
        assert "don't have access to collection" in response.json()["detail"]
        
        # Ensure minio_mock.upload_file was *not* called because of permission error
        integration_client.minio_mock.upload_file.assert_not_called()

    def test_list_files_with_valid_auth(self, integration_client, authenticated_headers):
        """Test file listing with valid authentication"""
        response = integration_client.get(
            "/api/files/list/test",
            headers=authenticated_headers
        )
        
        assert response.status_code == 200
        result = response.json()
        assert result["status"] == "success"
        assert result["collection"] == "test"
        assert len(result["files"]) == len(SAMPLE_FILES[:2])
        
        # Verify MinIO list was called with correct prefix
        integration_client.minio_mock.list_objects.assert_called_once_with(prefix="test/")

    def test_list_files_without_auth(self, integration_client):
        """Test file listing without authentication"""
        response = integration_client.get("/api/files/list/test")
        
        assert response.status_code == 401

    def test_download_file_with_valid_auth(self, integration_client, authenticated_headers):
        """Test file download with valid authentication"""
        # Configure mock to return file data
        test_content = b"Downloaded file content"
        integration_client.minio_mock.download_file.return_value = (
            test_content, 
            {"original_filename": "test.txt"}, 
            "text/plain"
        )
        
        response = integration_client.get(
            "/api/files/download/test/user/test.txt",
            headers=authenticated_headers
        )
        
        assert response.status_code == 200
        assert response.content == test_content
        assert response.headers["content-type"] == "text/plain"
        
        # Verify MinIO download was called
        integration_client.minio_mock.download_file.assert_called_once_with("test/user/test.txt")

    def test_invalid_metadata_format(self, integration_client, authenticated_headers):
        """Test upload with invalid metadata JSON"""
        test_file = ("test.txt", io.BytesIO(b"content"), "text/plain")
        
        response = integration_client.post(
            "/api/files/upload",
            files={"file": test_file},
            data={
                "collection": "test",
                "metadata": "invalid json"
            },
            headers=authenticated_headers
        )
        
        assert response.status_code == 400
        assert "Invalid metadata JSON format" in response.json()["detail"]
    def test_mock_verification(self, integration_client):
        """Verify the mock is properly set up"""
        from api.routers.files import get_minio_client

        # Get the mocked client directly
        mocked_client = app.dependency_overrides[get_minio_client]()

        # Call upload_file directly
        result = mocked_client.upload_file(
            io.BytesIO(b"test"), 
            "test/file.txt", 
            "text/plain"
        )

        logger.info(f"Direct mock call result: {result}")
        logger.info(f"Call count: {mocked_client.upload_file.call_count}")

        assert mocked_client.upload_file.call_count == 1
