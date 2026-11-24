from io import BytesIO
from typing import Tuple

from domain import (
    AuthenticatedPrincipal,
    File,
    FileDownloadError,
    FileNotFoundError,
    InsufficientPermissionsError,
)
from domain.repositories import (
    StorageError,
    StorageFileNotFoundError,
    StorageRepository,
)
from public_interfaces import DownloadFileRequest


class DownloadFileUseCase:
    def __init__(self, storage: StorageRepository):
        self.storage = storage

    def resolve_object_name(
        self, request: DownloadFileRequest, user: AuthenticatedPrincipal
    ) -> str:
        """Check read access, and return the full object name"""
        if not user.has_collection_permission(request.collection, "read"):
            raise InsufficientPermissionsError(
                f"You don't have read access to collection: {request.collection}"
            )

        # Construct full object name with proper path handling
        return (
            f"{request.collection}/{request.object_name}"
            if not request.object_name.startswith(f"{request.collection}/")
            else request.object_name
        )

    def execute(
        self, request: DownloadFileRequest, user: AuthenticatedPrincipal
    ) -> Tuple[BytesIO, File]:
        full_object_name = self.resolve_object_name(request, user)

        try:
            # Use repository protocol to get file content and metadata
            file_content, file_metadata = self.storage.retrieve_file(full_object_name)
            return file_content, file_metadata

        except StorageFileNotFoundError as e:
            raise FileNotFoundError(f"File not found: {str(e)}")
        except StorageError as e:
            raise FileDownloadError(f"Storage error during download: {str(e)}")
        except Exception as e:
            raise FileDownloadError(f"Unexpected error during download: {str(e)}")
