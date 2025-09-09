import pytest
from unittest.mock import MagicMock
from fastapi.testclient import TestClient

from api.main import app
from api.storage.minio import MinioClient # Import for type hinting

# Import shared test data
from .fixtures.test_data import SAMPLE_METADATA, SAMPLE_FILES, SAMPLE_USERS

# Shared test data fixtures
@pytest.fixture
def sample_file_content():
    """Sample binary content for file testing"""
    return b"Sample file content for testing"

@pytest.fixture
def sample_metadata():
    """Basic metadata for file testing"""
    return SAMPLE_METADATA["basic"]

@pytest.fixture
def sample_users():
    """Sample user data for testing"""
    return SAMPLE_USERS

