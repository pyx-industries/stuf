import pytest
from unittest.mock import patch, MagicMock
from fastapi import HTTPException

from api.auth.middleware import validate_token, get_current_user, User

@pytest.mark.unit
class TestValidateToken:
    def test_validate_token_success(self):
        """Test successful token validation"""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "active": True,
            "preferred_username": "testuser"
        }
        
        with patch('requests.post', return_value=mock_response):
            result = validate_token("valid_token")
            
        assert result is not None
        assert result["active"] is True
        assert result["preferred_username"] == "testuser"

    def test_validate_token_inactive(self):
        """Test inactive token handling"""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"active": False}
        
        with patch('requests.post', return_value=mock_response):
            result = validate_token("inactive_token")
            
        assert result is None

    def test_validate_token_request_failure(self):
        """Test request failure handling"""
        mock_response = MagicMock()
        mock_response.status_code = 500
        
        with patch('requests.post', return_value=mock_response):
            result = validate_token("token")
            
        assert result is None

@pytest.mark.unit
@pytest.mark.asyncio
class TestGetCurrentUser:
    async def test_get_current_user_success(self, mock_keycloak_validation):
        """Test successful user extraction"""
        user = await get_current_user("valid_token")
        
        assert isinstance(user, User)
        assert user.username == "testuser"
        assert "collection-test" in user.roles

    async def test_get_current_user_invalid_token(self):
        """Test invalid token handling"""
        with patch('api.auth.middleware.validate_token', return_value=None):
            with pytest.raises(HTTPException) as exc_info:
                await get_current_user("invalid_token")
            
            assert exc_info.value.status_code == 401

    async def test_get_current_user_missing_username(self):
        """Test handling of token without username"""
        mock_token_info = {
            "active": True,
            "realm_access": {"roles": ["user"]}
            # Missing preferred_username
        }
        
        with patch('api.auth.middleware.validate_token', return_value=mock_token_info):
            with pytest.raises(HTTPException) as exc_info:
                await get_current_user("token_without_username")
            
            assert exc_info.value.status_code == 401
