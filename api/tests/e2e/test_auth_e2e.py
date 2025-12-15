import pytest
from fastapi.security import HTTPBearer

from api.auth.middleware import (
    KEYCLOAK_REALM,
    KEYCLOAK_URL,
    bearer_scheme,
    verify_jwt_token,
)


@pytest.mark.e2e
class TestAuthenticationE2E:
    """True end-to-end authentication tests using real Keycloak"""

    def test_oauth2_configuration(self):
        """Test that OAuth2 scheme is properly configured"""

        # Verify bearer scheme type
        assert isinstance(bearer_scheme, HTTPBearer)

        # Verify Keycloak configuration is present
        assert KEYCLOAK_URL is not None
        assert KEYCLOAK_REALM is not None

    def test_token_validation_with_real_keycloak(self, real_keycloak_token):
        """Test token validation against real Keycloak instance"""

        # This should work with a real token from the fixture
        token_info = verify_jwt_token(real_keycloak_token)

        assert token_info is not None
        # JWT tokens have standard claims, not "active" like introspection
        assert "iss" in token_info  # Issuer is always present
        assert "exp" in token_info  # Expiration is always present
        # For user tokens, preferred_username should be present
        assert "preferred_username" in token_info
        # Collections should be present and parsed
        assert "collections" in token_info

    def test_invalid_token_rejection(self):
        """Test that invalid tokens are properly rejected"""

        # Test with obviously invalid token
        token_info = verify_jwt_token("invalid-token-12345")

        assert token_info is None

    def test_authenticated_endpoint_access(self, e2e_authenticated_client):
        """Test accessing authenticated endpoint with real token"""
        response = e2e_authenticated_client.get("/api/me")

        assert response.status_code == 200
        user_info = response.json()
        assert "username" in user_info
        assert "roles" in user_info

    def test_unauthenticated_endpoint_rejection(self, e2e_client):
        """Test that unauthenticated requests are rejected"""
        response = e2e_client.get("/api/me")

        assert response.status_code == 401
