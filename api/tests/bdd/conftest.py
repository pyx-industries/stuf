import pytest
from unittest.mock import MagicMock
from fastapi.testclient import TestClient
from api.main import app
from api.auth.middleware import User, get_current_user
from api.routers.files import get_minio_client
from api.storage.minio import MinioClient # Import for type hinting


@pytest.fixture
def bdd_mock_minio_client():
    """Mock MinIO client for BDD tests - provides the mock object"""
    mock = MagicMock(spec=MinioClient)
    # Configure default responses for common BDD scenarios
    mock.upload_file.return_value = "test/user/uploaded-file.txt"
    mock.list_objects.return_value = [
        {"name": "test/user/file1.txt", "size": 1024, "last_modified": "2023-01-01T10:00:00Z"},
        {"name": "test/user/file2.txt", "size": 2048, "last_modified": "2023-01-02T11:00:00Z"}
    ]
    mock.download_file.return_value = (b"BDD test content", {"original_filename": "test.txt"}, "text/plain")
    mock.get_presigned_url.return_value = "https://mock.minio.example.com/presigned-url"
    mock.delete_object.return_value = True
    return mock

@pytest.fixture
def bdd_client(bdd_mock_minio_client, request):
    """TestClient for BDD acceptance tests with mocked dependencies"""
    # Store original override to restore it after the test
    original_minio_override = app.dependency_overrides.get(get_minio_client)
    app.dependency_overrides[get_minio_client] = lambda: bdd_mock_minio_client

    
    with TestClient(app) as client:
        yield client
    
    # Teardown: Restore original dependency override
    if original_minio_override:
        app.dependency_overrides[get_minio_client] = original_minio_override
    else:
        app.dependency_overrides.pop(get_minio_client, None)

@pytest.fixture
def bdd_mock_user():
    """Create a mock user that can be customized per scenario"""
    def _create_user(username="testuser", roles=None):
        if roles is None:
            roles = ["user", "collection-test"]
        
        return User(
            username=username,
            email=f"{username}@example.com",
            full_name=f"{username.capitalize()} User",
            roles=roles,
            active=True
        )
    return _create_user

@pytest.fixture
def bdd_authenticated_user(request, bdd_mock_user):
    """Set up authenticated user for BDD scenarios"""
    from api.auth.middleware import get_current_user
    
    def _authenticate_as(username, roles):
        user = bdd_mock_user(username, roles)
        
        # Override the FastAPI dependency
        original_overrides = app.dependency_overrides.copy()
        app.dependency_overrides[get_current_user] = lambda: user
        
        # Clean up after test
        def cleanup():
            app.dependency_overrides = original_overrides
        request.addfinalizer(cleanup)
        
        return user
    
    return _authenticate_as
