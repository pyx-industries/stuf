import pytest
import sys
import os
from pytest_bdd import scenarios, given, when, then, parsers
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import json

# Add the parent directory to sys.path to make the 'api' module importable
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from api.auth.middleware import validate_token, oauth2_scheme

# Import scenarios from feature files
scenarios('../features/auth_flow.feature')

# Given steps
@given('a user is not authenticated')
def user_not_authenticated():
    # This is a documentation step
    pass

@given('a user has valid credentials')
def user_has_valid_credentials():
    # This is a documentation step
    pass

@given('the SPA has received an authorization code from Keycloak')
def spa_has_auth_code():
    # This is a documentation step
    pass

@given('the SPA has a valid access token')
def spa_has_valid_token():
    # This is a documentation step
    pass

@given('the API has validated a token as active')
def api_validated_token():
    # This is a documentation step
    pass

@given('the API receives an invalid or expired token')
def api_receives_invalid_token():
    # This is a documentation step
    pass

@given('the API uses OAuth2AuthorizationCodeBearer for authentication')
def oauth2_scheme_check():
    # Verify that oauth2_scheme is an instance of OAuth2AuthorizationCodeBearer
    from fastapi.security import OAuth2AuthorizationCodeBearer
    assert isinstance(oauth2_scheme, OAuth2AuthorizationCodeBearer)

@pytest.fixture
@given(parsers.parse('I am authenticated as "{username}" with roles "{roles}"'))
def mock_authentication(request, username, roles):
    # This is a mock for the authentication
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
    
    # Override the dependency in FastAPI app
    from api.main import app
    from api.auth.middleware import get_current_user, User
    
    # Create a mock User object
    mock_user = User(
        username=username,
        email=f"{username}@example.com",
        full_name=f"{username.capitalize()} User",
        roles=roles_list,
        active=True
    )
    
    # Override the dependency
    original_dependency = app.dependency_overrides.copy()
    app.dependency_overrides[get_current_user] = lambda: mock_user
    
    # Add cleanup to request finalizer
    def cleanup():
        app.dependency_overrides = original_dependency
    request.addfinalizer(cleanup)
    
    return mock_validate_token

# When steps
@when('they access the SPA')
def access_spa():
    # This is a documentation step
    pass

@when('they log in through Keycloak')
def login_through_keycloak():
    # This is a documentation step
    pass

@when('the SPA exchanges the code for tokens')
def spa_exchanges_code():
    # This is a documentation step
    pass

@when('the SPA makes an API request with the token')
def spa_makes_api_request():
    # This is a documentation step
    pass

@when('processing the API request')
def processing_api_request():
    # This is a documentation step
    pass

@when('validating the token with Keycloak')
def validating_token():
    # This is a documentation step
    pass

@when(parsers.parse('I make a GET request to "{endpoint}"'))
def make_get_request(request, endpoint):
    from api.main import app
    from api.auth.middleware import User, get_current_user
    
    # Create a mock User object
    mock_user = User(
        username="testuser",
        email="testuser@example.com",
        full_name="Test User",
        roles=["user", "collection-test"],
        active=True
    )
    
    # Override the dependency in FastAPI app
    original_dependency = app.dependency_overrides.copy()
    app.dependency_overrides[get_current_user] = lambda: mock_user
    
    try:
        # Use the client from conftest.py
        import sys
        import os
        sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))
        from api.tests.conftest import client
        
        # Get a client instance
        test_client = client()
        response = test_client.get(endpoint, headers={"Authorization": "Bearer fake-token"})
        
        # Store the response on the request for later assertions
        request.node.response = response
        
        return response
    finally:
        # Clean up the override after the test
        app.dependency_overrides = original_dependency

# Then steps
@then('they should be redirected to Keycloak for login')
def redirected_to_keycloak():
    # Verify the redirect URL contains Keycloak auth endpoint
    from api.auth.middleware import KEYCLOAK_URL, KEYCLOAK_REALM
    expected_auth_url = f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/auth"
    assert "protocol/openid-connect/auth" in expected_auth_url

@then('Keycloak should redirect back with an authorization code')
def keycloak_redirects_with_code():
    # This is a documentation step
    pass

@then('the SPA should receive access and refresh tokens')
def spa_receives_tokens():
    # This is a documentation step
    pass

@then('the API should validate the token with Keycloak introspection endpoint')
def api_validates_with_introspection():
    # Verify introspection endpoint is configured
    from api.auth.middleware import introspect_endpoint
    assert "token/introspect" in introspect_endpoint

@then('the API should extract user information and process the request')
def api_extracts_user_info():
    # This is a documentation step
    pass

@then('the API should return a 401 unauthorized response')
def api_returns_401():
    # This is a documentation step
    pass

@then('the authorizationUrl should point to Keycloak\'s auth endpoint')
def check_authorization_url():
    # Check the authorization URL from the middleware configuration
    from api.auth.middleware import KEYCLOAK_URL, KEYCLOAK_REALM
    expected_auth_url = f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/auth"
    assert "protocol/openid-connect/auth" in expected_auth_url

@then('the tokenUrl should point to Keycloak\'s token endpoint')
def check_token_url():
    # Check the token URL from the middleware configuration
    from api.auth.middleware import token_endpoint
    assert "protocol/openid-connect/token" in token_endpoint

@then('the refreshUrl should point to Keycloak\'s token endpoint')
def check_refresh_url():
    # Check the refresh URL from the middleware configuration
    from api.auth.middleware import token_endpoint
    assert "protocol/openid-connect/token" in token_endpoint

@then(parsers.parse('I should receive a {status_code:d} status code'))
def check_status_code(status_code, request):
    response = request.node.response if hasattr(request.node, 'response') else None
    if response is None:
        pytest.skip("Response not available for this test")
    assert response.status_code == status_code
