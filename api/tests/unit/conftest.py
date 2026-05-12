import pytest
from unittest.mock import MagicMock
from fastapi.testclient import TestClient
from api.tests.fixtures.test_data import SAMPLE_FILES

from api.main import app
from api.storage.minio import MinioClient  # Import for type hinting


@pytest.fixture
def mock_minio_client():
    """Mock MinIO client for unit tests - uses dependency override"""
    original_overrides = app.dependency_overrides.copy()

    mock = MagicMock(spec=MinioClient)
    # Configure default successful responses
    mock.upload_file.return_value = "test/user/file.txt"
    mock.list_objects.return_value = SAMPLE_FILES
    mock.download_file.return_value = (
        b"test content",
        {"original_filename": "test.txt"},
        "text/plain",
    )
    mock.get_presigned_url.return_value = "https://minio.example.com/presigned-url"
    mock.delete_object.return_value = True

    app.dependency_overrides[MinioClient] = lambda: mock

    yield mock

    # Teardown: Restore original dependency overrides
    app.dependency_overrides.clear()
    app.dependency_overrides.update(original_overrides)


@pytest.fixture
def unit_client(mock_minio_client):
    """
    TestClient for unit tests - all external dependencies should be mocked.
    It depends on other fixtures to ensure app.dependency_overrides are set.
    """
    # The app instance will have its dependencies overridden by the
    # mock_minio_client fixture.
    with TestClient(app) as client:
        yield client


@pytest.fixture
def mock_user():
    """Mock authenticated user for unit tests"""
    from api.auth.middleware import User

    return User(
        username="testuser",
        email="testuser@example.com",
        full_name="Test User",
        roles=["user", "collection-test"],
        active=True,
    )
