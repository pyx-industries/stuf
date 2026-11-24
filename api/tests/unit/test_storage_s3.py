import io
from unittest.mock import patch

import pytest
from botocore.exceptions import ClientError

from domain.repositories import StorageFileNotFoundError
from api.domain.services import FileParsingService
from api.storage.s3 import S3_BUCKET_NAME, S3Client
from api.storage.s3_repository import S3StorageRepository


def client_error(code, operation):
    return ClientError({"Error": {"Code": code, "Message": code}}, operation)


@pytest.fixture
def boto_client():
    """The boto3 client S3Client creates, mocked"""
    with patch("api.storage.s3.boto3.client") as client_factory:
        yield client_factory.return_value


@pytest.mark.unit
class TestS3Client:
    def test_upload_file_success(self, boto_client):
        """Test successful file upload, with user metadata"""
        file_data = io.BytesIO(b"test content")
        result = S3Client(ensure_bucket=False).upload_file(
            file_data, "test/file.txt", "text/plain", metadata={"test": "value"}
        )

        assert result == "test/file.txt"
        boto_client.put_object.assert_called_once_with(
            Bucket=S3_BUCKET_NAME,
            Key="test/file.txt",
            Body=file_data,
            ContentType="text/plain",
            Metadata={"test": "value"},
        )

    def test_upload_file_s3_error(self, boto_client):
        """Test file upload with S3 error"""
        boto_client.put_object.side_effect = client_error("InternalError", "PutObject")

        with pytest.raises(ClientError):
            S3Client(ensure_bucket=False).upload_file(
                io.BytesIO(b"test content"), "test/file.txt", "text/plain"
            )

    def test_download_file_success(self, boto_client):
        """Test successful file download"""
        boto_client.get_object.return_value = {
            "Body": io.BytesIO(b"test content"),
            "Metadata": {"test": "value"},
            "ContentType": "text/plain",
        }

        data, metadata, content_type = S3Client(ensure_bucket=False).download_file(
            "test/file.txt"
        )

        assert data == b"test content"
        assert metadata == {"test": "value"}
        assert content_type == "text/plain"

    def test_head_object(self, boto_client):
        """Size, user metadata and content type come back without a download"""
        boto_client.head_object.return_value = {
            "ContentLength": 12,
            "Metadata": {"uploader": "alice"},
            "ContentType": "text/plain",
        }

        info = S3Client(ensure_bucket=False).head_object("test/alice/file.txt")

        assert info == {
            "size": 12,
            "metadata": {"uploader": "alice"},
            "content_type": "text/plain",
        }
        boto_client.get_object.assert_not_called()

    def test_object_exists(self, boto_client):
        """Not found is False; any other error is raised"""
        client = S3Client(ensure_bucket=False)
        assert client.object_exists("test/file.txt") is True

        boto_client.head_object.side_effect = client_error("404", "HeadObject")
        assert client.object_exists("test/missing.txt") is False

        boto_client.head_object.side_effect = client_error("403", "HeadObject")
        with pytest.raises(ClientError):
            client.object_exists("test/file.txt")

    def test_list_objects_success(self, boto_client):
        """Test successful object listing, across pages"""
        boto_client.get_paginator.return_value.paginate.return_value = [
            {"Contents": [{"Key": "test/a.txt", "Size": 1024, "LastModified": "t1"}]},
            {"Contents": [{"Key": "test/b/c.txt", "Size": 2, "LastModified": "t2"}]},
        ]

        objects = S3Client(ensure_bucket=False).list_objects(prefix="test/")

        boto_client.get_paginator.return_value.paginate.assert_called_once_with(
            Bucket=S3_BUCKET_NAME, Prefix="test/"
        )
        assert [o["name"] for o in objects] == ["test/a.txt", "test/b/c.txt"]
        assert objects[0]["size"] == 1024

    def test_list_objects_empty(self, boto_client):
        """An empty prefix has no Contents key"""
        boto_client.get_paginator.return_value.paginate.return_value = [{}]

        assert S3Client(ensure_bucket=False).list_objects(prefix="test/") == []

    def test_delete_object_success(self, boto_client):
        """Test successful object deletion"""
        result = S3Client(ensure_bucket=False).delete_object("test/file.txt")

        assert result is True
        boto_client.delete_object.assert_called_once_with(
            Bucket=S3_BUCKET_NAME, Key="test/file.txt"
        )

    def test_creates_missing_bucket_on_first_use(self, boto_client):
        """The bucket is created when it does not exist yet"""
        boto_client.head_bucket.side_effect = client_error("404", "HeadBucket")

        S3Client().delete_object("test/file.txt")

        boto_client.create_bucket.assert_called_once_with(Bucket=S3_BUCKET_NAME)

    def test_failed_bucket_check_is_retried(self, boto_client):
        """A store unreachable on first use is tried again on the next call"""
        boto_client.head_bucket.side_effect = [client_error("503", "HeadBucket"), {}]
        client = S3Client()

        with pytest.raises(ClientError):
            client.delete_object("test/file.txt")
        client.delete_object("test/file.txt")

        boto_client.create_bucket.assert_not_called()
        boto_client.delete_object.assert_called_once()


STORED_NAME = "test/alice/20250101-120000-report.pdf"


@pytest.mark.unit
class TestStoragePathParsing:
    def test_parse_splits_after_the_whole_timestamp(self):
        parsed = FileParsingService.parse_storage_path(STORED_NAME)

        assert parsed["timestamp"] == "20250101-120000"
        assert parsed["original_filename"] == "report.pdf"
        assert parsed["owner"] == "alice"


@pytest.mark.unit
class TestGetFileInfo:
    def repository(self):
        return S3StorageRepository(S3Client(ensure_bucket=False))

    def test_maps_stored_object_to_file(self, boto_client):
        boto_client.head_object.return_value = {
            "ContentLength": 12,
            "Metadata": {"uploader": "alice"},
            "ContentType": "application/pdf",
        }

        file = self.repository().get_file_info(STORED_NAME)

        assert file.content_type == "application/pdf"
        assert file.size == 12
        assert file.metadata == {"uploader": "alice"}
        assert file.original_filename == "report.pdf"
        assert file.upload_time == "20250101-120000"

    def test_missing_metadata_and_content_type_get_defaults(self, boto_client):
        boto_client.head_object.return_value = {"ContentLength": 0, "Metadata": {}}

        file = self.repository().get_file_info(STORED_NAME)

        assert file.metadata == {}
        assert file.content_type == "application/octet-stream"

    def test_not_found(self, boto_client):
        boto_client.head_object.side_effect = client_error("404", "HeadObject")

        with pytest.raises(StorageFileNotFoundError):
            self.repository().get_file_info(STORED_NAME)
