from domain import (
    AuthenticatedPrincipal,
    File,
    FileDownloadError,
    FileNotFoundError,
)
from domain.repositories import StorageError, StorageFileNotFoundError
from public_interfaces import DownloadFileRequest

from usecases.download_file import DownloadFileUseCase


class GetFileMetadataUseCase(DownloadFileUseCase):
    """Reads a file's metadata with the same authorisation as fetching it"""

    def execute(
        self, request: DownloadFileRequest, user: AuthenticatedPrincipal
    ) -> File:
        full_object_name = self.resolve_object_name(request, user)

        try:
            return self.storage.get_file_info(full_object_name)
        except StorageFileNotFoundError as e:
            raise FileNotFoundError(f"File not found: {str(e)}")
        except StorageError as e:
            raise FileDownloadError(f"Storage error reading metadata: {str(e)}")
        except Exception as e:
            raise FileDownloadError(f"Unexpected error reading metadata: {str(e)}")
