import pytest
from unittest.mock import MagicMock
from fastapi.testclient import TestClient

from api.main import app
from api.routers.files import get_minio_client
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

# BDD fixtures
@pytest.fixture
def bdd_client():
    """TestClient for BDD acceptance tests"""
    from unittest.mock import MagicMock
    from api.main import app
    from api.routers.files import get_minio_client
    from api.storage.minio import MinioClient

    # Create mock MinIO client
    mock_minio = MagicMock(spec=MinioClient)
    mock_minio.upload_file.return_value = "test/user/uploaded-file.txt"
    mock_minio.list_objects.return_value = [
        {"name": "test/user/file1.txt", "size": 1024, "last_modified": "2023-01-01T10:00:00Z"},
        {"name": "test/user/file2.txt", "size": 2048, "last_modified": "2023-01-02T11:00:00Z"}
    ]
    mock_minio.download_file.return_value = (b"BDD test content", {"original_filename": "test.txt"}, "text/plain")
    mock_minio.get_presigned_url.return_value = "https://mock.minio.example.com/presigned-url"
    mock_minio.delete_object.return_value = True

    # Store original override to restore it after the test
    original_minio_override = app.dependency_overrides.get(get_minio_client)
    app.dependency_overrides[get_minio_client] = lambda: mock_minio

    with TestClient(app) as client:
        yield client

    # Teardown: Restore original dependency override
    if original_minio_override:
        app.dependency_overrides[get_minio_client] = original_minio_override
    else:
        app.dependency_overrides.pop(get_minio_client, None)

