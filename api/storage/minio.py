from minio import Minio
from minio.error import S3Error
import os
import io
from typing import List, Optional, BinaryIO
from datetime import timedelta

# MinIO configuration
MINIO_ENDPOINT = os.environ.get('MINIO_ENDPOINT', 'localhost:9000')
MINIO_ACCESS_KEY = os.environ.get('MINIO_ROOT_USER', 'minioadmin')
MINIO_SECRET_KEY = os.environ.get('MINIO_ROOT_PASSWORD', 'minioadmin')
MINIO_SECURE = os.environ.get('MINIO_SECURE', 'false').lower() == 'true'

# Default bucket name
DEFAULT_BUCKET = 'stuf-uploads'

class MinioClient:
    """MinIO client for S3 storage operations"""
    
    def __init__(self, ensure_bucket: bool = True):
        self.client = Minio(
            MINIO_ENDPOINT,
            access_key=MINIO_ACCESS_KEY,
            secret_key=MINIO_SECRET_KEY,
            secure=MINIO_SECURE
        )
        if ensure_bucket:
            try:
                self._ensure_bucket_exists(DEFAULT_BUCKET)
            except Exception as e:
                print(f"Warning: Could not ensure bucket exists: {e}")
    
    def _ensure_bucket_exists(self, bucket_name: str):
        """Ensure the bucket exists, create it if it doesn't"""
        try:
            if not self.client.bucket_exists(bucket_name):
                self.client.make_bucket(bucket_name)
                print(f"Bucket '{bucket_name}' created successfully")
            else:
                print(f"Bucket '{bucket_name}' already exists")
        except S3Error as err:
            print(f"Error creating bucket: {err}")
            raise
    
    def upload_file(self, file_data: BinaryIO, object_name: str, 
                   content_type: str, metadata: dict = None, 
                   bucket_name: str = DEFAULT_BUCKET) -> str:
        """Upload a file to MinIO storage"""
        try:
            # Get file size
            file_data.seek(0, os.SEEK_END)
            file_size = file_data.tell()
            file_data.seek(0)
            
            # Upload the file
            self.client.put_object(
                bucket_name=bucket_name,
                object_name=object_name,
                data=file_data,
                length=file_size,
                content_type=content_type,
                metadata=metadata
            )
            
            return object_name
        except S3Error as err:
            print(f"Error uploading file: {err}")
            raise
    
    def download_file(self, object_name: str, bucket_name: str = DEFAULT_BUCKET) -> tuple:
        """Download a file from MinIO storage"""
        try:
            # Get object data
            response = self.client.get_object(bucket_name, object_name)
            
            # Get object stats for metadata
            stats = self.client.stat_object(bucket_name, object_name)
            
            # Return the data and metadata
            return response.data, stats.metadata, stats.content_type
        except S3Error as err:
            print(f"Error downloading file: {err}")
            raise
    
    def get_presigned_url(self, object_name: str, expires: int = 3600, 
                         bucket_name: str = DEFAULT_BUCKET) -> str:
        """Generate a presigned URL for object download"""
        try:
            return self.client.presigned_get_object(
                bucket_name=bucket_name,
                object_name=object_name,
                expires=timedelta(seconds=expires)
            )
        except S3Error as err:
            print(f"Error generating presigned URL: {err}")
            raise
    
    def list_objects(self, prefix: str = "", bucket_name: str = DEFAULT_BUCKET) -> List[dict]:
        """List objects in the bucket with optional prefix"""
        try:
            objects = self.client.list_objects(bucket_name, prefix=prefix, recursive=True)
            return [
                {
                    "name": obj.object_name,
                    "size": obj.size,
                    "last_modified": obj.last_modified
                }
                for obj in objects
            ]
        except S3Error as err:
            print(f"Error listing objects: {err}")
            raise
    
    def delete_object(self, object_name: str, bucket_name: str = DEFAULT_BUCKET) -> bool:
        """Delete an object from the bucket"""
        try:
            self.client.remove_object(bucket_name, object_name)
            return True
        except S3Error as err:
            print(f"Error deleting object: {err}")
            raise

