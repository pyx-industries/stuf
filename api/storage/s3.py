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
S3_REGION = os.environ.get("S3_REGION", "us-east-1")
S3_BUCKET_NAME = os.environ.get("S3_BUCKET_NAME", "stuf-uploads")


logger = logging.getLogger(__name__)


class S3Client:
    """Client for an S3-compatible object store"""

    def __init__(self, ensure_bucket: bool = True):
        # The boto3 client, created on first use
        self.client = None
        self._should_ensure_bucket = ensure_bucket

    def _ensure_client(self):
        """
        Creates the boto3 client on first use and returns it, creating the
        bucket then too if configured to.
        """
        if self.client is None:
            self.client = boto3.client(
                "s3",
                endpoint_url=S3_ENDPOINT_URL,
                aws_access_key_id=S3_ACCESS_KEY_ID,
                aws_secret_access_key=S3_SECRET_ACCESS_KEY,
                region_name=S3_REGION,
                # Self-hosted stores route path-style requests without
                # needing a wildcard DNS name for each bucket.
                config=Config(
                    s3={"addressing_style": "path" if S3_ENDPOINT_URL else "auto"}
                ),
            )
            if self._should_ensure_bucket:
                try:
                    self._ensure_bucket_exists(S3_BUCKET_NAME)
                except Exception as e:
                    logger.warning(
                        f"Could not ensure bucket exists during lazy init: {e}"
                    )
        return self.client

    def _ensure_bucket_exists(self, bucket_name: str):
        """Ensure the bucket exists, create it if it doesn't"""
        try:
            self.client.head_bucket(Bucket=bucket_name)
            logger.info(f"Bucket '{bucket_name}' already exists")
        except ClientError:
            self.client.create_bucket(Bucket=bucket_name)
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

    def object_exists(
        self, object_name: str, bucket_name: str = S3_BUCKET_NAME
    ) -> bool:
        """Check whether an object exists"""
        try:
            self._ensure_client().head_object(Bucket=bucket_name, Key=object_name)
            return True
        except ClientError:
            return False

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
