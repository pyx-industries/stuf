from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2AuthorizationCodeBearer
from jose import jwt, JWTError
import requests
import os
from pydantic import BaseModel
from typing import List, Optional, Dict

# Keycloak configuration
KEYCLOAK_URL = os.environ.get('KEYCLOAK_URL', 'http://localhost:8080')  # For internal API calls (JWKS, etc.)
KEYCLOAK_ISSUER_URL = os.environ.get('KEYCLOAK_ISSUER_URL', 'http://localhost:8080')  # For JWT issuer validation
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
    roles: List[str] = []  # Generic roles (admin, trust-architect, project-participant)
    collections: Dict[str, List[str]] = {}  # Collection permissions: {"test": ["read", "write"], ...}
    active: bool = True
    
    def is_admin(self) -> bool:
        """Check if user has admin role"""
        return "admin" in self.roles
    
    def has_collection_permission(self, collection: str, permission: str) -> bool:
        """Check if user has specific permission for a collection"""
        if self.is_admin():
            return True  # Admin has all permissions
        
        collection_perms = self.collections.get(collection, [])
        return permission in collection_perms

def get_keycloak_public_keys():
    """Fetch Keycloak public keys for JWT verification"""
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        jwks_response = requests.get(jwks_uri, timeout=10)
        if jwks_response.status_code != 200:
            logger.error(f"Failed to fetch JWKS: {jwks_response.status_code}")
            return None
        
        jwks = jwks_response.json()
        return jwks
    except Exception as e:
        logger.error(f"Exception fetching JWKS: {e}")
        return None

def verify_jwt_token(token: str):
    """Verify and parse JWT token with proper signature validation"""
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info(f"Verifying JWT token (first 50 chars): {token[:50]}...")
    
    try:
        from jose import jwt, jwk
        from jose.exceptions import JWTError, JWTClaimsError, ExpiredSignatureError
        import time
        
        # Get Keycloak public keys
        jwks = get_keycloak_public_keys()
        if not jwks:
            logger.error("Could not fetch Keycloak public keys")
            return None
        
        # Decode token header to get key ID
        header = jwt.get_unverified_header(token)
        kid = header.get('kid')
        if not kid:
            logger.error("JWT token missing key ID")
            return None
        
        # Find the matching public key
        public_key = None
        for key in jwks.get('keys', []):
            if key.get('kid') == kid:
                public_key = jwk.construct(key)
                break
        
        if not public_key:
            logger.error(f"Could not find public key for kid: {kid}")
            return None
        
        # Verify and decode JWT with signature validation
        expected_issuer = f"{KEYCLOAK_ISSUER_URL}/realms/{KEYCLOAK_REALM}"
        
        # JWT validation options - disable audience verification to handle manually
        options = {
            'verify_aud': False,  # Handle audience validation manually
            'verify_iss': True,
            'verify_exp': True
        }
        
        token_payload = jwt.decode(
            token,
            public_key,
            algorithms=['RS256'],  # Keycloak uses RS256
            options=options,
            issuer=expected_issuer
        )
        
        # Manually validate audience since jose is strict about format
        token_aud = token_payload.get('aud', [])
        if isinstance(token_aud, str):
            token_aud = [token_aud]
        
        valid_audiences = {'stuf-api', 'stuf-spa'}
        if not any(aud in valid_audiences for aud in token_aud):
            logger.error(f"Invalid audience in token: {token_aud}")
            return None
        
        logger.debug(f"JWT verification successful. Payload keys: {list(token_payload.keys())}")
        return token_payload
        
    except ExpiredSignatureError:
        logger.warning("JWT token is expired")
        return None
    except JWTClaimsError as e:
        logger.error(f"JWT claims validation failed: {e}")
        return None
    except JWTError as e:
        logger.error(f"JWT verification failed: {e}")
        return None
    except Exception as e:
        logger.error(f"Exception during JWT verification: {e}")
        return None

async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    """Get the current user from the JWT token"""
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info(f"get_current_user called with token: {token[:50] if token else 'None'}...")
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token_payload = verify_jwt_token(token)
    
    if not token_payload:
        logger.error("JWT verification failed - token_payload is None")
        raise credentials_exception
    
    # Audience and issuer are already validated in verify_jwt_token()
    logger.info(f"DEBUG: JWT verification successful. Payload keys: {list(token_payload.keys())}")
    
    # Extract user information from JWT - try multiple username fields
    username = token_payload.get("preferred_username") or token_payload.get("username") or token_payload.get("sub")
    if username is None:
        logger.error(f"No username found in JWT. Available keys: {list(token_payload.keys())}")
        raise credentials_exception
    
    # Extract roles from realm_access
    realm_access = token_payload.get("realm_access", {})
    roles = realm_access.get("roles", [])
    
    # Extract and parse collections from custom claim
    collections = {}
    collections_claim = token_payload.get("collections")
    if collections_claim:
        try:
            if isinstance(collections_claim, str):
                import json
                collections = json.loads(collections_claim)
            else:
                collections = collections_claim  # Already parsed
            logger.debug(f"Parsed collections: {collections}")
        except (json.JSONDecodeError, TypeError) as e:
            logger.warning(f"Failed to parse collections claim: {e}")
    
    logger.info(f"Successfully authenticated user: {username} with roles: {roles}, collections: {collections}")
    
    return User(
        username=username,
        email=token_payload.get("email"),
        full_name=token_payload.get("name"),
        roles=roles,
        collections=collections,
        active=True  # JWT presence implies active
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
