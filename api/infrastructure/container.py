# Dependency Injection Container - Wire up dependencies at application startup

from typing import Optional
import logging

from domain.repositories import StorageRepository
from storage.minio_repository import MinioStorageRepository
from storage.minio import MinioClient

logger = logging.getLogger(__name__)


class Container:
    """
    Simple dependency injection container.
    
    Manages the creation and lifecycle of dependencies according to Uncle Bob's
    clean architecture principles - controllers don't know about concrete
    implementations, only interfaces defined by the domain.
    """
    
    def __init__(self):
        self._storage_repo: Optional[StorageRepository] = None
        self._minio_client: Optional[MinioClient] = None
    
    def storage_repository(self) -> StorageRepository:
        """Get the storage repository implementation (singleton pattern)"""
        if self._storage_repo is None:
            logger.info("Initializing StorageRepository with MinIO implementation")
            minio_client = self._get_minio_client()
            self._storage_repo = MinioStorageRepository(minio_client)
        return self._storage_repo
    
    def _get_minio_client(self) -> MinioClient:
        """Get MinIO client (singleton pattern)"""
        if self._minio_client is None:
            logger.info("Initializing MinIO client")
            self._minio_client = MinioClient()
        return self._minio_client
    
    def reset(self):
        """Reset container - useful for testing"""
        self._storage_repo = None
        self._minio_client = None


# Global container instance - initialized at application startup
container = Container()


def get_storage_repository() -> StorageRepository:
    """Dependency injection factory for FastAPI"""
    return container.storage_repository()


def reset_container():
    """Reset container - useful for testing"""
    container.reset()