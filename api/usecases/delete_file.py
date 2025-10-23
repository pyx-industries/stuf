from domain import (
    User,
    InsufficientPermissionsError,
    FileDeleteError,
    FileNotFoundError,
)
from domain.repositories import (
    StorageRepository,
    StorageError,
    StorageFileNotFoundError,
)
from public_interfaces import DeleteFileRequest


class DeleteFileUseCase:
    def __init__(self, storage: StorageRepository):
        self.storage = storage

    def execute(self, request: DeleteFileRequest, user: User) -> bool:
        if not user.has_collection_permission(request.collection, "delete"):
            raise InsufficientPermissionsError(
                f"You don't have delete access to collection: {request.collection}"
            )

        # Construct full object path with proper handling
        full_object_name = (
            f"{request.collection}/{request.object_name}"
            if not request.object_name.startswith(f"{request.collection}/")
            else request.object_name
        )

        try:
            # Delete using repository protocol
            success = self.storage.delete_file(full_object_name)
            return success

        except StorageFileNotFoundError as e:
            raise FileNotFoundError(f"File not found: {str(e)}")
        except StorageError as e:
            raise FileDeleteError(f"Storage error during deletion: {str(e)}")
        except Exception as e:
            raise FileDeleteError(f"Unexpected error during deletion: {str(e)}")
