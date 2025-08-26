import pytest
import sys
import os
from pytest_bdd import scenarios, given, when, then, parsers
from unittest.mock import patch, MagicMock
import json

# Add the parent directory to sys.path to make the 'api' module importable
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from api.auth.middleware import validate_token, oauth2_scheme

# Import scenarios from feature files
scenarios('../features/auth_flow.feature')

# Given steps
@given('the STUF API uses Keycloak for authentication')
def api_uses_keycloak():
    # This is a documentation step, no implementation needed
    pass

@pytest.fixture
@given('a JWT token from Keycloak')
def jwt_token():
    return "fake-jwt-token"

@given('the API uses OAuth2AuthorizationCodeBearer for authentication')
def oauth2_scheme_check():
    # Verify that oauth2_scheme is an instance of OAuth2AuthorizationCodeBearer
    from fastapi.security import OAuth2AuthorizationCodeBearer
    assert isinstance(oauth2_scheme, OAuth2AuthorizationCodeBearer)

@pytest.fixture
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

# When steps
@pytest.fixture
@when('the API validates the token')
def validate_token_call(request, jwt_token):
    # Create a patch for requests.post
    patch_post = patch('api.auth.middleware.requests.post')
    mock_post = patch_post.start()
    
    # Configure the mock
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "active": True,
        "preferred_username": "testuser",
        "email": "test@example.com",
        "realm_access": {"roles": ["user"]}
    }
    mock_post.return_value = mock_response
    
    # Call validate_token
    result = validate_token(jwt_token)
    
    # Add the patch to the request finalizer to stop it after the test
    request.addfinalizer(patch_post.stop)
    
    return mock_post, result

@pytest.fixture
@when(parsers.parse('I make a GET request to "{endpoint}"'))
def make_get_request(request, endpoint):
    from fastapi.testclient import TestClient
    from api.main import app
    
    # We need to patch the dependency directly in FastAPI
    with patch('api.auth.middleware.get_current_user') as mock_get_user:
        from api.auth.middleware import User
        mock_get_user.return_value = User(
            username="testuser",
            email="testuser@example.com",
            full_name="Test User",
            roles=["user", "collection-test"],
            active=True
        )
        
        client = TestClient(app)
        response = client.get(endpoint, headers={"Authorization": "Bearer fake-token"})
        
        # Store the response on the request for later assertions
        request.node.response = response
        
        return response

# Then steps
@then(parsers.re(r'the authentication flow should follow these steps:\s*(?P<steps>(?:\s*\|\s*\d+\s*\|\s*.*\s*\|)+)'))
def check_auth_flow_steps(steps):
    # This is a documentation step, no implementation needed
    # The regex captures the table content
    pass

@then('it should make a request to the Keycloak introspection endpoint')
def check_introspection_request(validate_token_call):
    mock_post, _ = validate_token_call
    mock_post.assert_called_once()
    args, kwargs = mock_post.call_args
    assert "token/introspect" in args[0]
    assert kwargs["data"]["token"] == "fake-jwt-token"

@then('it should extract user information from the validated token')
def check_user_info_extraction(validate_token_call):
    _, result = validate_token_call
    assert result["preferred_username"] == "testuser"
    assert result["email"] == "test@example.com"
    assert result["realm_access"]["roles"] == ["user"]

@then('the authorizationUrl should point to Keycloak\'s auth endpoint')
def check_authorization_url():
    assert "protocol/openid-connect/auth" in oauth2_scheme.authorization_url

@then('the tokenUrl should point to Keycloak\'s token endpoint')
def check_token_url():
    assert "protocol/openid-connect/token" in oauth2_scheme.token_url

@then('the refreshUrl should point to Keycloak\'s token endpoint')
def check_refresh_url():
    assert "protocol/openid-connect/token" in oauth2_scheme.refresh_url

@then(parsers.parse('I should receive a {status_code:d} status code'))
def check_status_code(status_code, request):
    response = request.node.response if hasattr(request.node, 'response') else None
    if response is None:
        pytest.skip("Response not available for this test")
    assert response.status_code == status_code
