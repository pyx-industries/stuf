# Domain Exceptions - Business rule violations and domain-level errors


class DomainError(Exception):
    """Base exception for domain-level errors"""

    pass


class InsufficientPermissionsError(DomainError):
    """Raised when user lacks required permissions for an operation"""

    pass


class InvalidMetadataError(DomainError):
    """Raised when metadata format is invalid"""

    pass


class FileUploadError(DomainError):
    """Raised when file upload operation fails"""

    pass


class FileListingError(DomainError):
    """Raised when file listing operation fails"""

    pass


class FileDownloadError(DomainError):
    """Raised when file download operation fails"""

    pass


class FileDeleteError(DomainError):
    """Raised when file deletion operation fails"""

    pass


class FileNotFoundError(DomainError):
    """Raised when requested file is not found"""

    pass
