import logging
import os
from typing import BinaryIO

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

# S3 configuration. Any S3-compatible store works; leave S3_ENDPOINT_URL unset
# for AWS itself, and the credentials unset to use boto3's own credential chain.
S3_ENDPOINT_URL = os.environ.get("S3_ENDPOINT_URL") or None
S3_ACCESS_KEY_ID = os.environ.get("S3_ACCESS_KEY_ID") or None
S3_SECRET_ACCESS_KEY = os.environ.get("S3_SECRET_ACCESS_KEY") or None
S3_REGION = os.environ.get("S3_REGION") or "us-east-1"
S3_BUCKET_NAME = os.environ.get("S3_BUCKET_NAME") or "stuf-uploads"


logger = logging.getLogger(__name__)


def is_not_found(e: Exception) -> bool:
    """Whether an S3 error says the bucket or object does not exist"""
    code = (
        e.response.get("Error", {}).get("Code") if isinstance(e, ClientError) else None
    )
    return code in {"404", "NoSuchKey", "NoSuchBucket", "NotFound"}


class S3Client:
    """Client for an S3-compatible object store"""

    def __init__(self, ensure_bucket: bool = True):
        # The boto3 client, created on first use
        self.client = None
        self._should_ensure_bucket = ensure_bucket

    def _ensure_client(self):
        """
        Creates the boto3 client on first use and returns it, creating the
        bucket then too if configured to. If that fails, the next call tries
        again.
        """
        if self.client is None:
            client = boto3.client(
                "s3",
                endpoint_url=S3_ENDPOINT_URL,
                aws_access_key_id=S3_ACCESS_KEY_ID,
                aws_secret_access_key=S3_SECRET_ACCESS_KEY,
                region_name=S3_REGION,
                # Self-hosted stores route path-style requests without
                # needing a wildcard DNS name for each bucket.
                # boto3 adds checksums to every request by default, which
                # many S3-compatible stores reject; send them only when an
                # operation requires one.
                config=Config(
                    s3={"addressing_style": "path" if S3_ENDPOINT_URL else "auto"},
                    request_checksum_calculation="when_required",
                    response_checksum_validation="when_required",
                ),
            )
            if self._should_ensure_bucket:
                self._ensure_bucket_exists(client, S3_BUCKET_NAME)
            self.client = client
        return self.client

    @staticmethod
    def _ensure_bucket_exists(client, bucket_name: str):
        """Ensure the bucket exists, create it if it doesn't"""
        try:
            client.head_bucket(Bucket=bucket_name)
        except ClientError as e:
            if not is_not_found(e):
                raise
            client.create_bucket(Bucket=bucket_name)
            logger.info(f"Bucket '{bucket_name}' created successfully")

    def upload_file(
        self,
        file_data: BinaryIO,
        object_name: str,
        content_type: str,
        metadata: dict | None = None,
        bucket_name: str = S3_BUCKET_NAME,
    ) -> str:
        """Upload a file, with user metadata stored as x-amz-meta-* headers"""
        self._ensure_client().put_object(
            Bucket=bucket_name,
            Key=object_name,
            Body=file_data,
            ContentType=content_type,
            Metadata=metadata or {},
        )
        return object_name

    def download_file(
        self, object_name: str, bucket_name: str = S3_BUCKET_NAME
    ) -> tuple:
        """Download a file, returning its data, user metadata and content type"""
        response = self._ensure_client().get_object(Bucket=bucket_name, Key=object_name)
        return response["Body"].read(), response["Metadata"], response["ContentType"]

    def head_object(self, object_name: str, bucket_name: str = S3_BUCKET_NAME) -> dict:
        """Read an object's size, user metadata and content type, without its data"""
        response = self._ensure_client().head_object(
            Bucket=bucket_name, Key=object_name
        )
        return {
            "size": response["ContentLength"],
            "metadata": response["Metadata"],
            "content_type": response["ContentType"],
        }

    def object_exists(
        self, object_name: str, bucket_name: str = S3_BUCKET_NAME
    ) -> bool:
        """Check whether an object exists"""
        try:
            self._ensure_client().head_object(Bucket=bucket_name, Key=object_name)
            return True
        except ClientError as e:
            if is_not_found(e):
                return False
            raise

    def get_presigned_url(
        self, object_name: str, expires: int = 3600, bucket_name: str = S3_BUCKET_NAME
    ) -> str:
        """Generate a presigned URL for object download"""
        return self._ensure_client().generate_presigned_url(
            "get_object",
            Params={"Bucket": bucket_name, "Key": object_name},
            ExpiresIn=expires,
        )

    def list_objects(
        self, prefix: str = "", bucket_name: str = S3_BUCKET_NAME
    ) -> list[dict]:
        """List all objects under a prefix, at any depth"""
        pages = (
            self._ensure_client()
            .get_paginator("list_objects_v2")
            .paginate(Bucket=bucket_name, Prefix=prefix)
        )
        return [
            {
                "name": obj["Key"],
                "size": obj["Size"],
                "last_modified": obj["LastModified"],
            }
            for page in pages
            for obj in page.get("Contents", [])
        ]

    def delete_object(
        self, object_name: str, bucket_name: str = S3_BUCKET_NAME
    ) -> bool:
        """Delete an object from the bucket"""
        self._ensure_client().delete_object(Bucket=bucket_name, Key=object_name)
        return True
