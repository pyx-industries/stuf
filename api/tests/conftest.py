import pytest
import os
import sys

# Add the parent directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

# Shared test data
@pytest.fixture
def sample_file_content():
    return b"Sample file content for testing"

@pytest.fixture
def sample_metadata():
    return {"description": "Test file", "category": "testing"}

# Add a client fixture for BDD tests that need it
@pytest.fixture
def client():
    """TestClient for BDD tests"""
    from fastapi.testclient import TestClient
    from api.main import app
    return TestClient(app)
