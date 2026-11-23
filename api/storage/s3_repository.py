from typing import List, Tuple
from io import BytesIO
import logging

from domain.models import File
from domain.services import FileParsingService, FileMetadataService
from domain.repositories import StorageError, StorageFileNotFoundError
from .s3 import S3Client

logger = logging.getLogger(__name__)


class S3StorageRepository:
    """
    S3 implementation of StorageRepository protocol.

    This class adapts the S3Client to conform to the StorageRepository
    protocol, handling all S3-specific concerns and translating between
    infrastructure and domain layers.
    """

    def __init__(self, s3_client: S3Client):
        self._client = s3_client

    def store_file(self, file_content: BytesIO, file: File) -> bool:
        """Store a file with its metadata in S3"""
        try:
            # Convert file metadata using domain service
            storage_metadata = FileMetadataService.to_storage_format(file.metadata)

            self._client.upload_file(
                file_data=file_content,
                object_name=file.object_name,  # Storage path already set in domain
                content_type=file.content_type,
                metadata=storage_metadata,
            )
            return True
        except Exception as e:
            logger.error(f"Failed to store file {file.object_name}: {e}")
            raise StorageError(f"Failed to store file: {str(e)}")

    def retrieve_file(self, object_name: str) -> Tuple[BytesIO, File]:
        """Retrieve a file and reconstruct File domain object from S3 metadata"""
        try:
            data, storage_metadata, content_type = self._client.download_file(
                object_name
            )

            # Parse storage path using domain service
            parsed_info = FileParsingService.parse_storage_path(object_name)

            # Create File object from parsed information
            file = File(
                object_name=object_name,
                collection=parsed_info["collection"],
                owner=parsed_info["owner"],
                original_filename=parsed_info["original_filename"],
                upload_time=parsed_info["timestamp"],
                content_type=content_type,
                size=len(data),
                metadata=storage_metadata or {},
            )

            return BytesIO(data), file

        except Exception as e:
            if "NoSuchKey" in str(e) or "not found" in str(e).lower():
                raise StorageFileNotFoundError(f"File not found: {object_name}")
            logger.error(f"Failed to retrieve file {object_name}: {e}")
            raise StorageError(f"Failed to retrieve file: {str(e)}")

    def list_files_in_collection(self, collection: str) -> List[File]:
        """List all files in a collection using S3 prefix listing"""
        try:
            prefix = f"{collection}/"
            storage_objects = self._client.list_objects(prefix=prefix)

            files = []
            for storage_obj in storage_objects:
                try:
                    # Parse storage path using domain service
                    object_name = storage_obj.get("name", "")
                    parsed_info = FileParsingService.parse_storage_path(object_name)

                    # Create File object from parsed information
                    domain_file = File(
                        object_name=object_name,
                        collection=parsed_info["collection"],
                        owner=parsed_info["owner"],
                        original_filename=parsed_info["original_filename"],
                        upload_time=parsed_info["timestamp"],
                        content_type="application/octet-stream",  # S3 listings don't include content type
                        size=storage_obj.get("size"),
                        metadata={
                            "last_modified": (
                                storage_obj.get("last_modified").isoformat()
                                if hasattr(
                                    storage_obj.get("last_modified"), "isoformat"
                                )
                                else str(storage_obj.get("last_modified"))
                            )
                            if storage_obj.get("last_modified")
                            else None
                        },
                    )
                    files.append(domain_file)
                except Exception as e:
                    # Log but continue - don't fail entire listing for one bad file
                    logger.warning(
                        f"Failed to parse file {storage_obj.get('name', 'unknown')}: {e}"
                    )
                    continue

            return files

        except Exception as e:
            logger.error(f"Failed to list files in collection {collection}: {e}")
            raise StorageError(f"Failed to list files: {str(e)}")

    def delete_file(self, object_name: str) -> bool:
        """Delete a file from S3 storage"""
        try:
            # First check if file exists to provide better error handling
            if not self.file_exists(object_name):
                raise StorageFileNotFoundError(f"File not found: {object_name}")

            result = self._client.delete_object(object_name)
            return result

        except StorageFileNotFoundError:
            raise  # Re-raise storage exception
        except Exception as e:
            logger.error(f"Failed to delete file {object_name}: {e}")
            raise StorageError(f"Failed to delete file: {str(e)}")

    def file_exists(self, object_name: str) -> bool:
        """Check if a file exists in S3 storage"""
        return self._client.object_exists(object_name)
