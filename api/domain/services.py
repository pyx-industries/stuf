# Domain Services - Complex business logic that doesn't belong in entities

from typing import Dict, Any
from datetime import datetime
import json


class FilePathService:
    """Domain service for generating file storage paths according to business rules"""

    PATH_SEPARATOR = "/"
    TIMESTAMP_FORMAT = "%Y%m%d-%H%M%S"

    @classmethod
    def generate_storage_path(
        cls, collection: str, username: str, filename: str, timestamp: datetime = None
    ) -> str:
        """
        Generate storage path according to business rules:
        Format: {collection}/{username}/{timestamp}-{filename}
        """
        if timestamp is None:
            timestamp = datetime.now()

        timestamp_str = timestamp.strftime(cls.TIMESTAMP_FORMAT)
        return f"{collection}{cls.PATH_SEPARATOR}{username}{cls.PATH_SEPARATOR}{timestamp_str}-{filename}"

    @classmethod
    def get_collection_prefix(cls, collection: str) -> str:
        """Get the collection prefix for storage operations"""
        return f"{collection}{cls.PATH_SEPARATOR}"


class FileMetadataService:
    """Domain service for handling file metadata transformations"""

    @staticmethod
    def parse_metadata_json(metadata_json: str) -> Dict[str, Any]:
        """Parse and validate metadata JSON string"""
        try:
            return json.loads(metadata_json)
        except json.JSONDecodeError:
            return {}

    @staticmethod
    def create_upload_metadata(
        uploader: str,
        upload_time: str,
        collection: str,
        original_filename: str,
        user_metadata: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Create complete upload metadata combining system and user metadata"""
        return {
            "uploader": uploader,
            "upload_time": upload_time,
            "collection": collection,
            "original_filename": original_filename,
            **user_metadata,
        }

    @staticmethod
    def to_storage_format(metadata: Dict[str, Any]) -> Dict[str, str]:
        """Convert file metadata to storage format (all string values)"""
        storage_metadata = {}
        for key, value in metadata.items():
            if value is not None:
                storage_metadata[str(key)] = str(value)
        return storage_metadata


class FileParsingService:
    """Domain service for parsing file information from storage paths"""

    @classmethod
    def parse_storage_path(cls, object_name: str) -> Dict[str, str]:
        """
        Parse storage path to extract components
        Expected format: {collection}/{username}/{timestamp}-{original_filename}
        """
        parts = object_name.split(FilePathService.PATH_SEPARATOR)

        if len(parts) >= 3:
            collection = parts[0]
            owner = parts[1]
            timestamp_and_filename = parts[2]

            # Try to split timestamp and filename
            if "-" in timestamp_and_filename:
                timestamp_part, filename_part = timestamp_and_filename.split("-", 1)
            else:
                timestamp_part = "unknown"
                filename_part = timestamp_and_filename
        else:
            # Fallback for unexpected format
            collection = parts[0] if parts else "unknown"
            owner = "unknown"
            timestamp_part = "unknown"
            filename_part = object_name.split(FilePathService.PATH_SEPARATOR)[-1]

        return {
            "collection": collection,
            "owner": owner,
            "timestamp": timestamp_part,
            "original_filename": filename_part,
        }
