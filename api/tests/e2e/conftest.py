import pytest
import os
import requests
from fastapi.testclient import TestClient
from api.main import app
from pytest_docker.plugin import DockerComposeProject

# E2E configuration - uses REAL services
KEYCLOAK_URL = os.environ.get('KEYCLOAK_URL', 'http://localhost:8080')
KEYCLOAK_REALM = os.environ.get('KEYCLOAK_REALM', 'stuf')
KEYCLOAK_CLIENT_ID = os.environ.get('KEYCLOAK_API_CLIENT_ID', 'stuf-api')

@pytest.fixture(scope="session")
def docker_compose_file(pytestconfig):
    """Path to the docker-compose.yml file."""
    return os.path.join(str(pytestconfig.rootdir), 'docker-compose.yml')

@pytest.fixture(scope="session")
def keycloak_container(docker_compose_project: DockerComposeProject):
    """Wait for the Keycloak service to be healthy."""
    service = docker_compose_project.get_service("keycloak").wait_for_condition(
        check_keycloak_ready,
        timeout=60
    )
    yield service

@pytest.fixture(scope="session")
def minio_container(docker_compose_project: DockerComposeProject):
    """Wait for the MinIO service to be healthy."""
    service = docker_compose_project.get_service("minio").wait_for_condition(
        check_minio_ready,
        timeout=60
    )
    yield service

def check_keycloak_ready(service):
    """Check if Keycloak is ready."""
    try:
        response = requests.get(f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}", timeout=2)
        return response.status_code == 200
    except requests.exceptions.RequestException:
        return False

def check_minio_ready(service):
    """Check if MinIO is ready."""
    try:
        minio_url = "http://localhost:9000"
        response = requests.get(f"{minio_url}/minio/health/ready", timeout=2)
        return response.status_code == 200
    except requests.exceptions.RequestException:
        return False

@pytest.fixture
def real_keycloak_token(keycloak_container):
    """Get a real token from Keycloak"""
    token_url = f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/token"
    
    # Use client credentials flow for E2E tests
    data = {
        'grant_type': 'client_credentials',
        'client_id': KEYCLOAK_CLIENT_ID,
        'client_secret': os.environ.get('KEYCLOAK_API_CLIENT_SECRET', 'some-secret-value')
    }
    
    response = requests.post(token_url, data=data)
    if response.status_code != 200:
        pytest.skip(f"Could not get token from Keycloak: {response.text}")
    
    return response.json()['access_token']

@pytest.fixture
def e2e_client(keycloak_container, minio_container):
    """TestClient for E2E tests - NO MOCKS, depends on real services being up"""
    return TestClient(app)

@pytest.fixture
def e2e_authenticated_client(e2e_client, real_keycloak_token, keycloak_container, minio_container):
    """Authenticated client for E2E tests"""
    e2e_client.headers.update({"Authorization": f"Bearer {real_keycloak_token}"})
    return e2e_client
