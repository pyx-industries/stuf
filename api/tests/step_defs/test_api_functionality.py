import pytest
from pytest_bdd import scenarios, given, when, then
from fastapi.testclient import TestClient

# Load scenarios from the feature file
scenarios('../features/api_functionality.feature')

@given('the API is running')
def api_is_running(bdd_client):
    """API is running and accessible"""
    pass

@when('I request the health endpoint')
def request_health_endpoint(bdd_client):
    """Make a request to the health endpoint"""
    bdd_client.response = bdd_client.get('/api/health')

@then('I should get a healthy status')
def check_healthy_status(bdd_client):
    """Verify the health check response"""
    assert bdd_client.response.status_code == 200
    assert bdd_client.response.json()['status'] == 'healthy'
