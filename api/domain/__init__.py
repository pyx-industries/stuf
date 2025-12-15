# Domain layer - contains all business logic and rules
# This package defines the core domain objects, services, and interfaces

from .exceptions import (
    DomainError,
    FileDeleteError,
    FileDownloadError,
    FileListingError,
    FileNotFoundError,
    FileUploadError,
    InsufficientPermissionsError,
    InvalidMetadataError,
)
from .models import AuthenticatedPrincipal, File, ServiceAccount, User
from .protocols import FileUpload
from .repositories import StorageRepository
from .services import FileMetadataService, FileParsingService, FilePathService

__all__ = [
    "User",
    "ServiceAccount",
    "AuthenticatedPrincipal",
    "File",
    "StorageRepository",
    "FileUpload",
    "FilePathService",
    "FileMetadataService",
    "FileParsingService",
    "DomainError",
    "InsufficientPermissionsError",
    "InvalidMetadataError",
    "FileUploadError",
    "FileListingError",
    "FileDownloadError",
    "FileDeleteError",
    "FileNotFoundError",
]
