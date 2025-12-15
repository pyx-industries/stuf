import asyncio
import io
from unittest.mock import Mock

import pytest
import requests
from domain.models import ServiceAccount
from fastapi.security import HTTPAuthorizationCredentials
from fastapi.testclient import TestClient

from api.auth.middleware import get_current_principal, verify_jwt_token
from api.main import app


@pytest.mark.e2e
class TestServiceAccountE2E:
    """End-to-end tests for service account authentication using real Keycloak"""

    def test_service_account_token_validation(self, service_account_token):
        """Test that service account token is valid and properly structured"""
        # Validate the service account token
        token_info = verify_jwt_token(service_account_token)

        assert token_info is not None
        # Service account tokens should have client_id/azp
        assert "azp" in token_info or "client_id" in token_info
        # Real Keycloak service accounts DO have preferred_username (e.g., "service-account-backup-service")
        assert "preferred_username" in token_info
        # But the preferred_username should start with "service-account-" for service accounts
        preferred_username = token_info.get("preferred_username", "")
        assert preferred_username.startswith("service-account-")
        assert "iss" in token_info  # Issuer
        assert "exp" in token_info  # Expiration
        assert "collections" in token_info  # Collection permissions

    def test_service_account_me_endpoint(self, e2e_service_account_client):
        """Test /api/me endpoint returns correct service account format"""
        response = e2e_service_account_client.get("/api/me")

        assert response.status_code == 200
        service_account_info = response.json()

        # Verify it's identified as a service account
        assert service_account_info["type"] == "service_account"

        # Verify service account specific fields
        assert "client_id" in service_account_info
        assert service_account_info["client_id"] == "backup-service"
        assert "name" in service_account_info
        assert "roles" in service_account_info
        assert "collections" in service_account_info
        assert "active" in service_account_info

        # Verify user-specific fields are NOT present
        assert "username" not in service_account_info
        assert "email" not in service_account_info
        assert "full_name" not in service_account_info

        # Verify permissions match what's configured in realm export
        collections = service_account_info["collections"]
        assert "test" in collections
        assert "read" in collections["test"]
        assert "shared" in collections
        assert "read" in collections["shared"]

    def test_service_account_file_read_access(self, e2e_service_account_client):
        """Test service account can read files from allowed collections"""
        # Service account should be able to list files in 'test' collection (read permission)
        response = e2e_service_account_client.get("/api/files/test")

        assert response.status_code == 200
        result = response.json()
        assert result["status"] == "success"
        assert result["collection"] == "test"
        assert "files" in result

    def test_service_account_file_write_denied(self, e2e_service_account_client):
        """Test service account is denied write access (only has read permission)"""
        # Service account only has read permission, not write
        test_file = ("test.txt", io.BytesIO(b"content"), "text/plain")

        response = e2e_service_account_client.post(
            "/api/files/test", files={"file": test_file}, data={"metadata": "{}"}
        )

        # Should be denied because service account only has read permission to 'test' collection
        assert response.status_code == 403
        assert "don't have write access" in response.json()["detail"]

    def test_service_account_unauthorized_collection_denied(
        self, e2e_service_account_client
    ):
        """Test service account is denied access to collections it doesn't have permissions for"""
        # Service account doesn't have access to 'restricted' collection
        response = e2e_service_account_client.get("/api/files/restricted")

        assert response.status_code == 403
        assert "don't have read access to collection" in response.json()["detail"]

    def test_service_account_token_detection(self, service_account_token):
        """Test that the middleware correctly identifies service account vs user tokens"""
        # Create a mock request with service account token
        mock_credentials = HTTPAuthorizationCredentials(
            scheme="Bearer", credentials=service_account_token
        )

        # This should return a ServiceAccount instance, not a User
        principal = asyncio.run(get_current_principal(mock_credentials))

        assert isinstance(principal, ServiceAccount)
        assert principal.client_id == "backup-service"
        # Service account tokens from Keycloak don't include realm roles by default
        # Authorization is based on collections, not roles
        assert isinstance(principal.roles, list)

    def test_service_account_vs_user_token_difference(
        self, service_account_token, real_keycloak_token
    ):
        """Test that service account and user tokens are handled differently"""
        # Get token payloads
        service_payload = verify_jwt_token(service_account_token)
        user_payload = verify_jwt_token(real_keycloak_token)

        # Service account token characteristics
        assert "azp" in service_payload or "client_id" in service_payload
        # Service accounts DO have preferred_username, but it starts with "service-account-"
        service_username = service_payload.get("preferred_username", "")
        assert service_username.startswith("service-account-")

        # User token characteristics
        assert "preferred_username" in user_payload
        user_username = user_payload.get("preferred_username", "")
        assert not user_username.startswith("service-account-")
        assert user_payload.get("azp") != service_payload.get("azp")

        # Both should have standard JWT claims
        for payload in [service_payload, user_payload]:
            assert "iss" in payload
            assert "exp" in payload
            assert "collections" in payload

    def test_service_account_scopes_included(self, service_account_token):
        """Test that service account tokens include OAuth2 scopes"""
        token_info = verify_jwt_token(service_account_token)

        # Service account tokens should include scopes
        assert "scope" in token_info
        scopes = token_info["scope"].split() if token_info.get("scope") else []
        assert len(scopes) > 0  # Should have at least some scopes

    def test_service_account_authentication_flow_e2e(self, ensure_services_ready):
        """Test complete service account authentication flow from token request to API access"""
        # Step 1: Get service account token via client credentials
        token_url = (
            f"http://keycloak-e2e:8080/realms/stuf/protocol/openid-connect/token"
        )

        data = {
            "grant_type": "client_credentials",
            "client_id": "backup-service",
            "client_secret": "backup-service-secret",
            "scope": "stuf:access",
        }

        token_response = requests.post(token_url, data=data)
        assert token_response.status_code == 200

        token_data = token_response.json()
        assert "access_token" in token_data
        assert "token_type" in token_data
        assert token_data["token_type"] == "Bearer"

        # Step 2: Use token to access STUF API
        client = TestClient(app)
        headers = {"Authorization": f"Bearer {token_data['access_token']}"}

        # Step 3: Verify service account identity
        me_response = client.get("/api/me", headers=headers)
        assert me_response.status_code == 200

        account_info = me_response.json()
        assert account_info["type"] == "service_account"
        assert account_info["client_id"] == "backup-service"

        # Step 4: Test allowed operation (read)
        files_response = client.get("/api/files/test", headers=headers)
        assert files_response.status_code == 200

        # Step 5: Test denied operation (write)
        test_file = ("test.txt", io.BytesIO(b"content"), "text/plain")
        upload_response = client.post(
            "/api/files/test",
            files={"file": test_file},
            data={"metadata": "{}"},
            headers=headers,
        )
        assert upload_response.status_code == 403  # Denied because only has read access
