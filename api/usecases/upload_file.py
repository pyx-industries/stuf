from typing import Dict, Any
import io
from datetime import datetime

from domain import (
    User, File, FileUpload, 
    InsufficientPermissionsError, InvalidMetadataError, FileUploadError,
    FilePathService, FileMetadataService
)
from domain.repositories import StorageRepository, StorageError
from public_interfaces import UploadFileRequest


class UploadFileUseCase:
    def __init__(self, storage: StorageRepository):
        self.storage = storage

    async def execute(self, request: UploadFileRequest, file: FileUpload, user: User) -> File:
        if not user.has_collection_permission(request.collection, "write"):
            raise InsufficientPermissionsError(
                f"You don't have write access to collection: {request.collection}"
            )
        
        # Parse and validate metadata using domain service
        metadata_dict = FileMetadataService.parse_metadata_json(request.metadata)
        if not metadata_dict and request.metadata != "{}":
            raise InvalidMetadataError("Invalid metadata JSON format")
        
        # Generate timestamp and storage path using domain services
        timestamp = datetime.now()
        timestamp_str = timestamp.strftime(FilePathService.TIMESTAMP_FORMAT)
        storage_path = FilePathService.generate_storage_path(
            request.collection, user.username, file.filename or "unknown", timestamp
        )
        
        # Create upload metadata using domain service
        upload_metadata = FileMetadataService.create_upload_metadata(
            uploader=user.username,
            upload_time=timestamp_str,
            collection=request.collection,
            original_filename=file.filename or "unknown",
            user_metadata=metadata_dict
        )
        
        # Create File domain object
        domain_file = File(
            object_name=storage_path,
            collection=request.collection,
            owner=user.username,
            original_filename=file.filename or "unknown",
            upload_time=timestamp_str,
            content_type=file.content_type or "application/octet-stream",
            metadata=upload_metadata
        )
        
        # Read file content
        file_content = await file.read()
        
        try:
            # Set file size from actual content
            domain_file.size = len(file_content)
            
            # Upload using repository protocol
            success = self.storage.store_file(
                io.BytesIO(file_content),
                domain_file
            )
            
            if not success:
                raise FileUploadError("File upload operation failed")
            
            return domain_file
            
        except StorageError as e:
            raise FileUploadError(f"Storage error during upload: {str(e)}")
        except Exception as e:
            raise FileUploadError(f"Unexpected error during upload: {str(e)}")