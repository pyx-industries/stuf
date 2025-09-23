import pytest
import io


@pytest.mark.e2e
class TestCompleteWorkflow:
    """True end-to-end tests using real services"""

    def test_complete_file_upload_workflow(self, e2e_authenticated_client):
        """Test the complete file upload and retrieval workflow"""
        # Create test file
        test_content = b"This is E2E test content"

        # Upload file
        response = e2e_authenticated_client.post(
            "/api/files/test",
            files={"file": ("e2e_test.txt", io.BytesIO(test_content), "text/plain")},
            data={"metadata": '{"description": "E2E test file"}'},
        )

        assert response.status_code == 200
        upload_result = response.json()
        assert upload_result["status"] == "success"
        object_name = upload_result["object_name"]

        # List files to verify upload
        response = e2e_authenticated_client.get("/api/files/test")
        assert response.status_code == 200

        files = response.json()["files"]
        assert any(f["object_name"] == object_name for f in files)

        # Download file to verify content
        # Extract the path part after collection/
        file_path = object_name.split("/", 1)[1]
        response = e2e_authenticated_client.get(f"/api/files/test/{file_path}")
        assert response.status_code == 200
        assert response.content == test_content

    def test_unauthorized_access_rejected(self, e2e_client):
        """Test that unauthorized requests are properly rejected"""
        response = e2e_client.get("/api/files/test")
        assert response.status_code == 401

    def test_health_and_info_endpoints(self, e2e_client):
        """Test public endpoints work without authentication"""
        # Health check
        response = e2e_client.get("/api/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"

        # Info endpoint
        response = e2e_client.get("/api/info")
        assert response.status_code == 200
        assert response.json()["name"] == "STUF API"

    def test_user_info_endpoint(self, e2e_authenticated_client):
        """Test authenticated user info endpoint"""
        response = e2e_authenticated_client.get("/api/me")
        assert response.status_code == 200

        user_info = response.json()
        assert "username" in user_info
        assert "roles" in user_info
        assert user_info["active"] is True

    def test_complete_file_upload_and_delete_workflow(self, e2e_authenticated_client):
        """Test complete workflow: upload, verify, delete, verify deletion"""
        # Create test file
        test_content = b"This is E2E delete test content"

        # Upload file
        response = e2e_authenticated_client.post(
            "/api/files/test",
            files={"file": ("delete_test.txt", io.BytesIO(test_content), "text/plain")},
            data={
                "metadata": '{"description": "E2E delete test file"}',
            },
        )

        assert response.status_code == 200
        upload_result = response.json()
        assert upload_result["status"] == "success"
        object_name = upload_result["object_name"]

        # List files to verify upload
        response = e2e_authenticated_client.get("/api/files/test")
        assert response.status_code == 200

        files = response.json()["files"]
        uploaded_file = next(
            (f for f in files if f["object_name"] == object_name), None
        )
        assert (
            uploaded_file is not None
        ), f"Uploaded file {object_name} not found in listing"

        # Delete file
        # Extract the path part after collection/
        file_path = object_name.split("/", 1)[1]
        response = e2e_authenticated_client.delete(f"/api/files/test/{file_path}")
        assert response.status_code == 200

        delete_result = response.json()
        assert delete_result["status"] == "success"
        assert delete_result["message"] == "File deleted successfully"

        # Verify download fails after deletion (more reliable than listing check due to eventual consistency)
        response = e2e_authenticated_client.get(f"/api/files/test/{file_path}")
        assert response.status_code == 404

    def test_delete_nonexistent_file(self, e2e_authenticated_client):
        """Test deletion of file that doesn't exist"""
        response = e2e_authenticated_client.delete(
            "/api/files/test/user/nonexistent-file.txt"
        )

        # Should return 404 for file not found
        assert response.status_code == 404

    def test_delete_without_permission(self, e2e_limited_client):
        """Test deletion without proper permissions"""
        response = e2e_limited_client.delete("/api/files/test/user/some-file.txt")

        assert response.status_code == 403
        assert "don't have delete access to collection" in response.json()["detail"]

    # Presigned URL test commented out since endpoint was removed (YAGNI)
