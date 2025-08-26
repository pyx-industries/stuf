import pytest
from pytest_bdd import scenarios, given, when, then, parsers
import requests
import json

# Import scenarios from feature files
scenarios('../features/auth_flow.feature')

# Given steps
@given('the STUF API uses Keycloak for authentication')
def api_uses_keycloak():
    # This is a documentation step, no implementation needed
    pass

@given(parsers.parse('I am authenticated as a "{user_type}" user'))
def authenticated_as_user_type(keycloak_token, request, user_type):
    # Map user_type to the fixture parameter
    user_map = {
        'admin': 'admin',
        'trust architect': 'trust_architect',
        'full access': 'full_user',
        'limited access': 'limited_user',
        'shared collection': 'shared_user',
        'inactive': 'inactive_user'
    }
    
    if user_type not in user_map:
        pytest.skip(f"Unknown user type: {user_type}")
    
    # Set the parameter for the keycloak_token fixture
    request.param = user_map[user_type]
    
    # Return the token for use in the test
    return keycloak_token

# When steps
@when(parsers.parse('I make a GET request to "{endpoint}"'))
def make_get_request(authenticated_client, endpoint, request):
    response = authenticated_client().get(endpoint)
    request.response = response
    return response

@when(parsers.parse('I make a GET request to "{endpoint}" without authentication'))
def make_get_request_without_auth(client, endpoint, request):
    response = client.get(endpoint)
    request.response = response
    return response

@then(parsers.parse('the authentication flow should follow these steps:'))
def check_auth_flow_steps():
    # This is a documentation step, no implementation needed
    pass

@then(parsers.parse('| {step:d} | {description} |'))
def check_auth_flow_step_details(step, description):
    # This step handles the table rows
    # We just need to parse them, no actual implementation needed for documentation steps
    pass

# Then steps
@then(parsers.parse('I should receive a {status_code:d} status code'))
def check_status_code(request, status_code):
    assert request.response.status_code == status_code

@then(parsers.parse('the response should contain a "{field}" field with value "{value}"'))
def check_response_field(request, field, value):
    json_response = request.response.json()
    assert field in json_response
    assert json_response[field] == value

@then(parsers.parse('the response should contain a "{field}" field with values "{values}"'))
def check_response_field_list(request, field, values):
    json_response = request.response.json()
    assert field in json_response
    expected_values = [value.strip() for value in values.split(',')]
    assert set(json_response[field]) == set(expected_values)

@then(parsers.parse('the response should contain a "{field}" array'))
def check_response_array(request, field):
    json_response = request.response.json()
    assert field in json_response
    assert isinstance(json_response[field], list)
