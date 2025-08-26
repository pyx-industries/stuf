import pytest
import io
import json
from fastapi.testclient import TestClient
from unittest.mock import patch

from api.main import app

@pytest.mark.integration
class TestFilesAPIIntegration:
    """Integration tests that test the full request flow with mocked external services"""
    
    def test_upload_file_with_valid_auth(self, integration_client, authenticated_headers, mock_external_services):
        """Test file upload with valid authentication"""
        # Create test file
        test_content = b"This is integration test content"
        test_file = ("test.txt", io.BytesIO(test_content), "text/plain")
        
        response = integration_client.post(
            "/api/files/upload",
            files={"file": test_file},
            data={
                "collection": "test",
                "metadata": '{"description": "Integration test file"}'
            },
            headers=authenticated_headers
        )
        
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

    def test_upload_file_wrong_collection(self, mock_external_services, integration_client):
        """Test file upload to unauthorized collection"""
        # Mock user with limited access
        with patch('requests.post') as mock_requests:
            mock_requests.return_value.status_code = 200
            mock_requests.return_value.json.return_value = {
                "active": True,
                "preferred_username": "limiteduser",
                "realm_access": {"roles": ["collection-other"]}  # No access to "test"
            }
            
            test_file = ("test.txt", io.BytesIO(b"content"), "text/plain")
            
            response = integration_client.post(
                "/api/files/upload",
                files={"file": test_file},
                data={"collection": "test", "metadata": "{}"},
                headers={"Authorization": "Bearer valid-token"}
            )
            
            assert response.status_code == 403
            assert "don't have access to collection" in response.json()["detail"]

    def test_list_files_with_valid_auth(self, integration_client, authenticated_headers, mock_external_services):
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

    def test_download_file_with_valid_auth(self, integration_client, authenticated_headers, mock_external_services):
        """Test file download with valid authentication"""
        # Configure mock to return file data
        test_content = b"Downloaded file content"
        mock_external_services['minio'].download_file.return_value = (
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

    def test_invalid_metadata_format(self, mock_external_services, integration_client, authenticated_headers):
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
