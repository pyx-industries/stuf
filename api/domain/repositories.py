from typing import Protocol, List, Tuple, Optional, runtime_checkable, TYPE_CHECKING
from io import BytesIO

# TYPE_CHECKING Pattern for Circular Import Prevention:
#
# TYPE_CHECKING is a special constant that is True during static type checking
# (mypy, IDE analysis) but False at runtime. This allows us to import types
# for static analysis without causing circular imports during execution.
#
# At runtime, Python doesn't resolve the string type hints "File" and "User"
# immediately - they're only resolved when needed (lazy evaluation). This
# combination of TYPE_CHECKING + string annotations prevents the circular
# import while maintaining full type safety for static analysis.
#
# Alternative approaches considered:
# 1. Moving protocol to separate module - breaks domain layer cohesion  
# 2. Using Any types - loses type safety
# 3. Import at function level - impacts runtime performance
#
# This pattern is the Python-recommended solution for circular type dependencies.

if TYPE_CHECKING:
    from .models import File, User


@runtime_checkable
class StorageRepository(Protocol):
    """
    Storage repository protocol for file operations.
    
    This protocol defines the contract for storage operations using only
    domain objects and primitive types, maintaining strict clean architecture
    boundaries. All implementations must be runtime_checkable.
    """
    
    def store_file(
        self, 
        file_content: BytesIO, 
        file: "File"
    ) -> bool:
        """
        Store a file with its metadata.
        
        Args:
            file_content: Binary content of the file
            file: Domain File object containing metadata and storage path
            
        Returns:
            bool: True if successful
            
        Raises:
            StorageError: If storage operation fails
        """
        ...
    
    def retrieve_file(self, object_name: str) -> Tuple[BytesIO, "File"]:
        """
        Retrieve a file and its metadata.
        
        Args:
            object_name: Storage path/key for the file
            
        Returns:
            Tuple of (file_content, file_metadata)
            
        Raises:
            FileNotFoundError: If file doesn't exist
            StorageError: If retrieval operation fails
        """
        ...
    
    def list_files_in_collection(self, collection: str) -> List["File"]:
        """
        List all files in a collection.
        
        Args:
            collection: Collection name to list files from
            
        Returns:
            List of File domain objects
            
        Raises:
            StorageError: If listing operation fails
        """
        ...
    
    def delete_file(self, object_name: str) -> bool:
        """
        Delete a file from storage.
        
        Args:
            object_name: Storage path/key for the file
            
        Returns:
            bool: True if successful
            
        Raises:
            FileNotFoundError: If file doesn't exist
            StorageError: If deletion operation fails
        """
        ...
    
    def file_exists(self, object_name: str) -> bool:
        """
        Check if a file exists in storage.
        
        Args:
            object_name: Storage path/key for the file
            
        Returns:
            bool: True if file exists
            
        Raises:
            StorageError: If check operation fails
        """
        ...


# Storage-specific exceptions (infrastructure layer)
class StorageError(Exception):
    """Base exception for storage infrastructure operations"""
    pass


class StorageFileNotFoundError(StorageError):
    """Raised when a requested file is not found in storage"""
    pass


class FileAlreadyExistsError(StorageError):
    """Raised when trying to create a file that already exists"""
    pass


class InsufficientStorageSpaceError(StorageError):
    """Raised when there's insufficient storage space"""
    pass


class InvalidFilePathError(StorageError):
    """Raised when file path is invalid"""
    pass