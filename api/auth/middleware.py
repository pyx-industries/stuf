from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2AuthorizationCodeBearer
from jose import jwt, JWTError
import requests
import os
from pydantic import BaseModel
from typing import List, Optional

# Keycloak configuration
KEYCLOAK_URL = os.environ.get('KEYCLOAK_URL', 'http://localhost:8080')
KEYCLOAK_REALM = os.environ.get('KEYCLOAK_REALM', 'stuf')
KEYCLOAK_CLIENT_ID = os.environ.get('KEYCLOAK_CLIENT_ID', 'stuf-api')
KEYCLOAK_CLIENT_SECRET = os.environ.get('KEYCLOAK_CLIENT_SECRET', 'some-secret-value')

# Keycloak endpoints
token_endpoint = f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/token"
userinfo_endpoint = f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/userinfo"
introspect_endpoint = f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/token/introspect"
jwks_uri = f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/certs"

# OAuth2 scheme for token validation
oauth2_scheme = OAuth2AuthorizationCodeBearer(
    authorizationUrl=f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/auth",
    tokenUrl=token_endpoint,
    refreshUrl=f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/token",
    scopes={}
)

class User(BaseModel):
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    roles: List[str] = []
    active: bool = True

def validate_token(token: str):
    """Validate the token with Keycloak introspection endpoint"""
    import logging
    logger = logging.getLogger(__name__)
    
    data = {
        'token': token,
        'client_id': KEYCLOAK_CLIENT_ID,
        'client_secret': KEYCLOAK_CLIENT_SECRET
    }
    
    logger.info(f"DEBUG: Introspecting token at: {introspect_endpoint}")
    logger.info(f"DEBUG: Using client_id: {KEYCLOAK_CLIENT_ID}")
    logger.info(f"DEBUG: Token (first 50 chars): {token[:50]}...")
    
    try:
        response = requests.post(introspect_endpoint, data=data, timeout=10)
        logger.info(f"DEBUG: Introspection response status: {response.status_code}")
        logger.info(f"DEBUG: Introspection response: {response.text}")
        
        if response.status_code != 200:
            logger.error(f"DEBUG: Introspection failed with status {response.status_code}: {response.text}")
            return None
        
        token_info = response.json()
        logger.info(f"DEBUG: Token info: {token_info}")
        
        # Check if token is active
        if not token_info.get('active', False):
            logger.warning(f"DEBUG: Token is not active: {token_info}")
            return None
            
        return token_info
    except Exception as e:
        logger.error(f"DEBUG: Exception during token validation: {e}")
        return None

async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    """Get the current user from the token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token_info = validate_token(token)
    
    if not token_info:
        raise credentials_exception
    
    # Extract user information from token
    username = token_info.get("preferred_username")
    if username is None:
        raise credentials_exception
    
    # Extract roles
    realm_access = token_info.get("realm_access", {})
    roles = realm_access.get("roles", [])
    
    return User(
        username=username,
        email=token_info.get("email"),
        full_name=token_info.get("name"),
        roles=roles,
        active=token_info.get("active", True)
    )

def require_role(required_role: str):
    """Dependency to check if the user has a specific role"""
    async def role_checker(current_user: User = Depends(get_current_user)):
        if required_role not in current_user.roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role {required_role} required"
            )
        return current_user
    return role_checker
