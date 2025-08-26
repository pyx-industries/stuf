import pytest
import sys
import os
from pytest_bdd import scenarios, given, when, then, parsers
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

# Add the parent directory to sys.path to make the 'api' module importable
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from api.main import app
from api.auth.middleware import User, get_current_user

# Import scenarios from feature files
scenarios('../features/api_functionality.feature')

# Fixtures
@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def response():
    return {}

# Given steps
@given(parsers.parse('I am authenticated as "{username}" with roles "{roles}"'))
def mock_authentication(request, username, roles):
    # This is a mock for the authentication
    # In a real test, you would set up the authentication properly
    roles_list = [role.strip() for role in roles.split(',')]
    
    # Create a patch for the validate_token function
    patch_validate_token = patch('api.auth.middleware.validate_token')
    mock_validate_token = patch_validate_token.start()
    
    # Configure the mock
    mock_token_info = {
        "preferred_username": username,
        "email": f"{username}@example.com",
        "name": f"{username.capitalize()} User",
        "realm_access": {"roles": roles_list},
        "active": True
    }
    mock_validate_token.return_value = mock_token_info
    
    # Add the patch to the request finalizer to stop it after the test
    request.addfinalizer(patch_validate_token.stop)
    
    return mock_validate_token

@given('there are files in the "test" collection')
def mock_files_in_collection(request):
    # Mock the storage client's list_objects method
    patch_list_objects = patch('api.storage.minio.minio_client.list_objects')
    mock_list_objects = patch_list_objects.start()
    
    # Configure the mock
    mock_list_objects.return_value = [
        {"name": "test/file1.txt", "size": 1024, "last_modified": "2023-01-01T00:00:00Z"}
    ]
    
    # Add the patch to the request finalizer to stop it after the test
    request.addfinalizer(patch_list_objects.stop)
    
    return mock_list_objects

# When steps
@when(parsers.parse('I make a GET request to "{endpoint}"'))
def make_get_request(client, response, endpoint, mock_authentication=None):
    # Ensure the mock_authentication is applied to the request
    headers = {"Authorization": "Bearer fake-token"}
    
    # We need to override the dependency in FastAPI app
    app.dependency_overrides[get_current_user] = lambda: User(
        username="testuser",
        email="testuser@example.com",
        full_name="Test User",
        roles=["user", "collection-test"],
        active=True
    )
    
    # Make the request
    response['response'] = client.get(endpoint, headers=headers)
    
    # Clean up the override after the test
    app.dependency_overrides = {}

@when(parsers.parse('I make a GET request to "{endpoint}" without authentication'))
def make_get_request_without_auth(client, response, endpoint):
    response['response'] = client.get(endpoint)

@when(parsers.parse('I make a POST request to "{endpoint}" without authentication'))
def make_post_request_without_auth(client, response, endpoint):
    response['response'] = client.post(endpoint)

# Then steps
@then(parsers.parse('I should receive a {status_code:d} status code'))
def check_status_code(response, status_code):
    assert response['response'].status_code == status_code

@then(parsers.parse('the response should contain a "{field}" field with value "{value}"'))
def check_response_field(response, field, value):
    json_response = response['response'].json()
    assert field in json_response
    assert json_response[field] == value

@then(parsers.parse('the response should contain a "{field}" field with values "{values}"'))
def check_response_field_list(response, field, values):
    json_response = response['response'].json()
    assert field in json_response
    expected_values = [value.strip() for value in values.split(',')]
    assert set(json_response[field]) == set(expected_values)

@then(parsers.parse('the response should contain a "{field}" array'))
def check_response_array(response, field):
    json_response = response['response'].json()
    assert field in json_response
    assert isinstance(json_response[field], list)
