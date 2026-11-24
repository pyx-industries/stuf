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


class GetFileMetadataUseCase:
    def __init__(self, storage: StorageRepository):
        self.storage = storage

    def execute(
        self, request: DownloadFileRequest, user: AuthenticatedPrincipal
    ) -> File:
        # Same authorisation as fetching the file itself
        if not user.has_collection_permission(request.collection, "read"):
            raise InsufficientPermissionsError(
                f"You don't have read access to collection: {request.collection}"
            )

        full_object_name = (
            f"{request.collection}/{request.object_name}"
            if not request.object_name.startswith(f"{request.collection}/")
            else request.object_name
        )

        try:
            return self.storage.get_file_info(full_object_name)
        except StorageFileNotFoundError as e:
            raise FileNotFoundError(f"File not found: {str(e)}")
        except StorageError as e:
            raise FileDownloadError(f"Storage error reading metadata: {str(e)}")
        except Exception as e:
            raise FileDownloadError(f"Unexpected error reading metadata: {str(e)}")
