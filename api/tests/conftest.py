import pytest
import sys
import os
from fastapi.testclient import TestClient
from unittest.mock import patch

# Add the parent directory to sys.path to make the 'api' module importable
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

# Mock the MinioClient before importing app
with patch('api.storage.minio.MinioClient'):
    from api.main import app

@pytest.fixture
def client():
    return TestClient(app)
