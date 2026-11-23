import io
from unittest.mock import patch

import pytest
from botocore.exceptions import ClientError

from api.storage.s3 import S3_BUCKET_NAME, S3Client


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

    def test_object_exists(self, boto_client):
        """Test the existence check, both ways"""
        client = S3Client(ensure_bucket=False)
        assert client.object_exists("test/file.txt") is True

        boto_client.head_object.side_effect = client_error("404", "HeadObject")
        assert client.object_exists("test/missing.txt") is False

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
