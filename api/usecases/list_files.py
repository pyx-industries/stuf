from typing import List

from domain import (
    AuthenticatedPrincipal,
    File,
    FileListingError,
    InsufficientPermissionsError,
)
from domain.repositories import StorageError, StorageRepository
from public_interfaces import ListFilesRequest


class ListFilesUseCase:
    def __init__(self, storage: StorageRepository):
        self.storage = storage

    def execute(
        self, request: ListFilesRequest, user: AuthenticatedPrincipal
    ) -> List[File]:
        if not user.has_collection_permission(request.collection, "read"):
            raise InsufficientPermissionsError(
                f"You don't have read access to collection: {request.collection}"
            )

        try:
            # Use repository protocol to get domain objects directly
            domain_files = self.storage.list_files_in_collection(request.collection)
            return domain_files

        except StorageError as e:
            raise FileListingError(f"Storage error during listing: {str(e)}")
        except Exception as e:
            raise FileListingError(f"Unexpected error during listing: {str(e)}")
