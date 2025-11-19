import io
from unittest.mock import MagicMock, patch

import pytest
from minio.error import S3Error

from api.storage.minio import MINIO_BUCKET_NAME, MinioClient


@pytest.mark.unit
class TestMinioClient:
    def test_upload_file_success(self):
        """Test successful file upload"""
        with patch("api.storage.minio.Minio") as mock_minio_class:
            mock_client = MagicMock()
            mock_minio_class.return_value = mock_client
            mock_client.bucket_exists.return_value = True

            minio_client = MinioClient(ensure_bucket=False)

            file_data = io.BytesIO(b"test content")
            result = minio_client.upload_file(
                file_data, "test/file.txt", "text/plain", metadata={"test": "value"}
            )

            assert result == "test/file.txt"
            mock_client.put_object.assert_called_once()

    def test_upload_file_s3_error(self):
        """Test file upload with S3 error"""
        with patch("api.storage.minio.Minio") as mock_minio_class:
            mock_client = MagicMock()
            mock_minio_class.return_value = mock_client
            mock_client.bucket_exists.return_value = (
                False  # No need to create bucket if we're mocking operations
            )
            mock_client.put_object.side_effect = S3Error(
                code="InternalError",
                message="Upload failed",
                resource="test/file.txt",
                request_id="test-request-id",
                host_id="test-host-id",
                response=MagicMock(),
            )

            minio_client = MinioClient(ensure_bucket=False)

            file_data = io.BytesIO(b"test content")

            with pytest.raises(S3Error):
                minio_client.upload_file(file_data, "test/file.txt", "text/plain")

    def test_download_file_success(self):
        """Test successful file download"""
        with patch("api.storage.minio.Minio") as mock_minio_class:
            mock_client = MagicMock()
            mock_minio_class.return_value = mock_client
            mock_client.bucket_exists.return_value = (
                False  # No need to create bucket if we're mocking operations
            )

            # Mock response object
            mock_response = MagicMock()
            mock_response.data = b"test content"
            mock_client.get_object.return_value = mock_response

            # Mock stats object
            mock_stats = MagicMock()
            mock_stats.metadata = {"test": "value"}
            mock_stats.content_type = "text/plain"
            mock_client.stat_object.return_value = mock_stats

            minio_client = MinioClient(ensure_bucket=False)

            data, metadata, content_type = minio_client.download_file("test/file.txt")

            assert data == b"test content"
            assert metadata == {"test": "value"}
            assert content_type == "text/plain"

    def test_list_objects_success(self):
        """Test successful object listing"""
        with patch("api.storage.minio.Minio") as mock_minio_class:
            mock_client = MagicMock()
            mock_minio_class.return_value = mock_client
            mock_client.bucket_exists.return_value = (
                False  # No need to create bucket if we're mocking operations
            )

            # Mock object
            mock_obj = MagicMock()
            mock_obj.object_name = "test/file.txt"
            mock_obj.size = 1024
            mock_obj.last_modified = "2023-01-01T00:00:00Z"

            mock_client.list_objects.return_value = [mock_obj]

            minio_client = MinioClient(ensure_bucket=False)

            objects = minio_client.list_objects(prefix="test/")

            assert len(objects) == 1
            assert objects[0]["name"] == "test/file.txt"
            assert objects[0]["size"] == 1024

    def test_delete_object_success(self):
        """Test successful object deletion"""
        with patch("api.storage.minio.Minio") as mock_minio_class:
            mock_client = MagicMock()
            mock_minio_class.return_value = mock_client
            mock_client.bucket_exists.return_value = (
                False  # No need to create bucket if we're mocking operations
            )

            minio_client = MinioClient(ensure_bucket=False)

            result = minio_client.delete_object("test/file.txt")

            assert result is True
            mock_client.remove_object.assert_called_once_with(
                MINIO_BUCKET_NAME, "test/file.txt"
            )
