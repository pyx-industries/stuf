import pytest
import os
import sys

# Add the parent directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

# Import shared test data
from api.tests.fixtures.test_data import SAMPLE_METADATA, SAMPLE_FILES, SAMPLE_USERS

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
