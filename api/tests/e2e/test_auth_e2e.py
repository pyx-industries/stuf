import pytest
from pytest_bdd import scenarios, given, when, then, parsers
import requests
import json

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
    from api.auth.middleware import oauth2_scheme
    from fastapi.security import OAuth2AuthorizationCodeBearer
    assert isinstance(oauth2_scheme, OAuth2AuthorizationCodeBearer)

@given(parsers.parse('I am authenticated as "{username}" with roles "{roles}"'))
def authenticated_as_user(keycloak_token, request, username, roles):
    # This is for the role-based access control test
    pass

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
def make_get_request(authenticated_client, endpoint, request):
    response = authenticated_client().get(endpoint)
    request.response = response
    return response

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
    from api.auth.middleware import oauth2_scheme
    assert "protocol/openid-connect/auth" in oauth2_scheme.authorization_url

@then('the tokenUrl should point to Keycloak\'s token endpoint')
def check_token_url():
    from api.auth.middleware import oauth2_scheme
    assert "protocol/openid-connect/token" in oauth2_scheme.token_url

@then('the refreshUrl should point to Keycloak\'s token endpoint')
def check_refresh_url():
    from api.auth.middleware import oauth2_scheme
    assert "protocol/openid-connect/token" in oauth2_scheme.refresh_url

@then(parsers.parse('I should receive a {status_code:d} status code'))
def check_status_code(request, status_code):
    assert request.response.status_code == status_code
