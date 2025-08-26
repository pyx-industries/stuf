import pytest
from unittest.mock import patch, MagicMock, mock_open
import io
from minio.error import S3Error

from api.storage.minio import MinioClient

@pytest.mark.unit
class TestMinioClient:
    def test_upload_file_success(self):
        """Test successful file upload"""
        with patch('api.storage.minio.Minio') as mock_minio_class:
            mock_client = MagicMock()
            mock_minio_class.return_value = mock_client
            mock_client.bucket_exists.return_value = True
            
            minio_client = MinioClient()
            
            file_data = io.BytesIO(b"test content")
            result = minio_client.upload_file(
                file_data, 
                "test/file.txt", 
                "text/plain",
                metadata={"test": "value"}
            )
            
            assert result == "test/file.txt"
            mock_client.put_object.assert_called_once()

    def test_upload_file_s3_error(self):
        """Test file upload with S3 error"""
        with patch('api.storage.minio.Minio') as mock_minio_class:
            mock_client = MagicMock()
            mock_minio_class.return_value = mock_client
            mock_client.bucket_exists.return_value = True
            mock_client.put_object.side_effect = S3Error(
                code="InternalError",
                message="Upload failed",
                resource="test/file.txt",
                request_id="test-request-id",
                host_id="test-host-id",
                response=MagicMock()
            )
            
            minio_client = MinioClient()
            
            file_data = io.BytesIO(b"test content")
            
            with pytest.raises(S3Error):
                minio_client.upload_file(file_data, "test/file.txt", "text/plain")

    def test_download_file_success(self):
        """Test successful file download"""
        with patch('api.storage.minio.Minio') as mock_minio_class:
            mock_client = MagicMock()
            mock_minio_class.return_value = mock_client
            mock_client.bucket_exists.return_value = True
            
            # Mock response object
            mock_response = MagicMock()
            mock_response.data = b"test content"
            mock_client.get_object.return_value = mock_response
            
            # Mock stats object
            mock_stats = MagicMock()
            mock_stats.metadata = {"test": "value"}
            mock_stats.content_type = "text/plain"
            mock_client.stat_object.return_value = mock_stats
            
            minio_client = MinioClient()
            
            data, metadata, content_type = minio_client.download_file("test/file.txt")
            
            assert data == b"test content"
            assert metadata == {"test": "value"}
            assert content_type == "text/plain"

    def test_list_objects_success(self):
        """Test successful object listing"""
        with patch('api.storage.minio.Minio') as mock_minio_class:
            mock_client = MagicMock()
            mock_minio_class.return_value = mock_client
            mock_client.bucket_exists.return_value = True
            
            # Mock object
            mock_obj = MagicMock()
            mock_obj.object_name = "test/file.txt"
            mock_obj.size = 1024
            mock_obj.last_modified = "2023-01-01T00:00:00Z"
            
            mock_client.list_objects.return_value = [mock_obj]
            
            minio_client = MinioClient()
            
            objects = minio_client.list_objects(prefix="test/")
            
            assert len(objects) == 1
            assert objects[0]["name"] == "test/file.txt"
            assert objects[0]["size"] == 1024

    def test_delete_object_success(self):
        """Test successful object deletion"""
        with patch('api.storage.minio.Minio') as mock_minio_class:
            mock_client = MagicMock()
            mock_minio_class.return_value = mock_client
            mock_client.bucket_exists.return_value = True
            
            minio_client = MinioClient()
            
            result = minio_client.delete_object("test/file.txt")
            
            assert result is True
            mock_client.remove_object.assert_called_once_with("stuf-uploads", "test/file.txt")
