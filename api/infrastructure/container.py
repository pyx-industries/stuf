# Dependency Injection Container - Wire up dependencies at application startup

import logging
from typing import Optional

from domain.repositories import StorageRepository
from storage.s3 import S3Client
from storage.s3_repository import S3StorageRepository

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
        self._s3_client: Optional[S3Client] = None

    def storage_repository(self) -> StorageRepository:
        """Get the storage repository implementation (singleton pattern)"""
        if self._storage_repo is None:
            logger.info("Initializing StorageRepository with S3 implementation")
            s3_client = self._get_s3_client()
            self._storage_repo = S3StorageRepository(s3_client)
        return self._storage_repo

    def _get_s3_client(self) -> S3Client:
        """Get S3 client (singleton pattern)"""
        if self._s3_client is None:
            logger.info("Initializing S3 client")
            self._s3_client = S3Client()
        return self._s3_client

    def reset(self):
        """Reset container - useful for testing"""
        self._storage_repo = None
        self._s3_client = None


# Global container instance - initialized at application startup
container = Container()


def get_storage_repository() -> StorageRepository:
    """Dependency injection factory for FastAPI"""
    return container.storage_repository()


def reset_container():
    """Reset container - useful for testing"""
    container.reset()
