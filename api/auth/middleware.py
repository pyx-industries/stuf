import json
import logging
import os
from typing import Optional, Union

import requests
from domain.models import ServiceAccount, User
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwk, jwt
from jose.exceptions import ExpiredSignatureError, JWTClaimsError, JWTError

# Keycloak configuration
KEYCLOAK_URL = os.environ.get(
    "KEYCLOAK_URL", "http://localhost:8080"
)  # For internal API calls (JWKS, etc.)
KEYCLOAK_ISSUER_URL = os.environ.get(
    "KEYCLOAK_ISSUER_URL", "http://localhost:8080"
)  # For JWT issuer validation
KEYCLOAK_REALM = os.environ.get("KEYCLOAK_REALM", "stuf")
KEYCLOAK_CLIENT_ID = os.environ.get("KEYCLOAK_CLIENT_ID", "stuf-api")
KEYCLOAK_CLIENT_SECRET = os.environ.get("KEYCLOAK_CLIENT_SECRET", "some-secret-value")

# Keycloak endpoints
token_endpoint = f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/token"
userinfo_endpoint = (
    f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/userinfo"
)
introspect_endpoint = (
    f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/token/introspect"
)
jwks_uri = f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/certs"


# Bearer token scheme for both user and service account validation
# Using auto_error=False to handle authentication errors manually
bearer_scheme = HTTPBearer(auto_error=False)


def get_keycloak_public_keys():
    """Fetch Keycloak public keys for JWT verification"""
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
    logger = logging.getLogger(__name__)

    logger.info(f"Verifying JWT token (first 50 chars): {token[:50]}...")

    try:
        # Get Keycloak public keys
        jwks = get_keycloak_public_keys()
        if not jwks:
            logger.error("Could not fetch Keycloak public keys")
            return None

        # Decode token header to get key ID
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")
        if not kid:
            logger.error("JWT token missing key ID")
            return None

        # Find the matching public key
        public_key = None
        for key in jwks.get("keys", []):
            if key.get("kid") == kid:
                public_key = jwk.construct(key)
                break

        if not public_key:
            logger.error(f"Could not find public key for kid: {kid}")
            return None

        # Verify and decode JWT with signature validation
        expected_issuer = f"{KEYCLOAK_ISSUER_URL}/realms/{KEYCLOAK_REALM}"

        # JWT validation options - disable audience verification to handle manually
        options = {
            "verify_aud": False,  # Handle audience validation manually
            "verify_iss": True,
            "verify_exp": True,
        }

        token_payload = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],  # Keycloak uses RS256
            options=options,
            issuer=expected_issuer,
        )

        # Manually validate audience since jose is strict about format
        token_aud = token_payload.get("aud", [])
        if isinstance(token_aud, str):
            token_aud = [token_aud]

        valid_audiences = {"stuf-api", "stuf-spa"}
        if not any(aud in valid_audiences for aud in token_aud):
            logger.error(f"Invalid audience in token: {token_aud}")
            return None

        logger.debug(
            f"JWT verification successful. Payload keys: {list(token_payload.keys())}"
        )
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


async def get_current_user(
    token: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> User:
    """Get the current user from the JWT token"""
    logger = logging.getLogger(__name__)

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Handle missing authentication (401)
    if token is None:
        logger.error("No authorization header provided")
        raise credentials_exception

    logger.info(
        f"get_current_user called with token: {token.credentials[:50] if token else 'None'}..."
    )

    token_payload = verify_jwt_token(token.credentials)

    if not token_payload:
        logger.error("JWT verification failed - token_payload is None")
        raise credentials_exception

    # Audience and issuer are already validated in verify_jwt_token()
    logger.debug(
        f"JWT verification successful. Payload keys: {list(token_payload.keys())}"
    )

    # Extract user information from JWT - try multiple username fields
    username = (
        token_payload.get("preferred_username")
        or token_payload.get("username")
        or token_payload.get("sub")
    )
    if username is None:
        logger.error(
            f"No username found in JWT. Available keys: {list(token_payload.keys())}"
        )
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
                collections = json.loads(collections_claim)
            else:
                collections = collections_claim  # Already parsed
            logger.debug(f"Parsed collections: {collections}")
        except (json.JSONDecodeError, TypeError) as e:
            logger.warning(f"Failed to parse collections claim: {e}")

    logger.info(
        f"Successfully authenticated user: {username} with roles: {roles}, collections: {collections}"
    )

    # Ensure this is a user token, not a service account
    if not token_payload.get("preferred_username") and not token_payload.get(
        "username"
    ):
        if token_payload.get("azp") or token_payload.get("client_id"):
            logger.error("Service account token used for user authentication")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Service account token not valid for user authentication",
                headers={"WWW-Authenticate": "Bearer"},
            )

    return User(
        username=username,
        email=token_payload.get("email"),
        full_name=token_payload.get("name"),
        roles=roles,
        collections=collections,
        active=True,  # JWT presence implies active
    )


async def get_current_service_account(
    token: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> ServiceAccount:
    """Get the current service account from the JWT token"""
    logger = logging.getLogger(__name__)

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate service account credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Handle missing authentication (401)
    if token is None:
        logger.error("No authorization header provided")
        raise credentials_exception

    logger.info(
        f"get_current_service_account called with token: {token.credentials[:50] if token else 'None'}..."
    )

    token_payload = verify_jwt_token(token.credentials)

    if not token_payload:
        logger.error("JWT verification failed - token_payload is None")
        raise credentials_exception

    # Extract client ID for service account
    client_id = token_payload.get("azp") or token_payload.get("client_id")
    if not client_id:
        logger.error("No client_id found in JWT - not a service account token")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not a valid service account token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Extract roles from realm_access
    realm_access = token_payload.get("realm_access", {})
    roles = realm_access.get("roles", [])

    # Extract and parse collections from custom claim
    collections = {}
    collections_claim = token_payload.get("collections")
    if collections_claim:
        try:
            if isinstance(collections_claim, str):
                collections = json.loads(collections_claim)
            else:
                collections = collections_claim  # Already parsed
            logger.debug(f"Parsed collections: {collections}")
        except (json.JSONDecodeError, TypeError) as e:
            logger.warning(f"Failed to parse collections claim: {e}")

    # Extract scopes
    scopes = (
        token_payload.get("scope", "").split() if token_payload.get("scope") else []
    )

    logger.info(
        f"Successfully authenticated service account: {client_id} with roles: {roles}, collections: {collections}"
    )

    return ServiceAccount(
        client_id=client_id,
        name=token_payload.get("name", client_id),
        description=token_payload.get("description", ""),
        roles=roles,
        collections=collections,
        scopes=scopes,
        active=True,  # JWT presence implies active
    )


async def get_current_principal(
    token: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> Union[User, ServiceAccount]:
    """Get the current authenticated principal (user or service account) from JWT token"""
    logger = logging.getLogger(__name__)

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Handle missing authentication (401)
    if token is None:
        logger.error("No authorization header provided")
        raise credentials_exception

    logger.info(
        f"get_current_principal called with token: {token.credentials[:50] if token else 'None'}..."
    )

    token_payload = verify_jwt_token(token.credentials)

    if not token_payload:
        logger.error("JWT verification failed - token_payload is None")
        raise credentials_exception

    # Determine if this is a user or service account token
    client_id = token_payload.get("azp") or token_payload.get("client_id")
    has_username = token_payload.get("preferred_username") or token_payload.get(
        "username"
    )

    if has_username and not client_id:
        # This is a user token
        logger.debug("Detected user token")
        return await get_current_user(token)
    elif client_id and not has_username:
        # This is a service account token
        logger.debug("Detected service account token")
        return await get_current_service_account(token)
    else:
        logger.error(
            f"Ambiguous token type - has_username: {bool(has_username)}, has_client_id: {bool(client_id)}"
        )
        raise credentials_exception


def require_role(required_role: str):
    """Dependency to check if the principal has a specific role"""

    async def role_checker(
        current_principal: Union[User, ServiceAccount] = Depends(get_current_principal),
    ):
        if not current_principal.has_role(required_role):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role {required_role} required",
            )
        return current_principal

    return role_checker
