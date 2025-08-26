import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from api.main import app
from api.auth.middleware import User, get_current_user

@pytest.fixture
def bdd_client():
    """TestClient for BDD acceptance tests"""
    return TestClient(app)

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
def bdd_mock_services():
    """Mock external services for BDD scenarios"""
    minio_mock = MagicMock()
    
    # Configure default responses for common BDD scenarios
    minio_mock.upload_file.return_value = "test/user/uploaded-file.txt"
    minio_mock.list_objects.return_value = [
        {"name": "test/user/file1.txt", "size": 1024, "last_modified": "2023-01-01T10:00:00Z"},
        {"name": "test/user/file2.txt", "size": 2048, "last_modified": "2023-01-02T11:00:00Z"}
    ]
    minio_mock.download_file.return_value = (b"BDD test content", {"original_filename": "test.txt"}, "text/plain")
    
    with patch('api.storage.minio.minio_client', minio_mock):
        yield minio_mock

@pytest.fixture
def bdd_authenticated_user(request, bdd_client, bdd_mock_user):
    """Set up authenticated user for BDD scenarios"""
    def _authenticate_as(username, roles):
        user = bdd_mock_user(username, roles)
        
        # Override the FastAPI dependency
        from api.main import app
        original_overrides = app.dependency_overrides.copy()
        app.dependency_overrides[get_current_user] = lambda: user
        
        # Clean up after test
        def cleanup():
            app.dependency_overrides = original_overrides
        request.addfinalizer(cleanup)
        
        return user
    
    return _authenticate_as
