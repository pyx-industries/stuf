import json
import logging
import os
import time
from typing import Optional, Union

import requests
from domain.models import ServiceAccount, User
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwk, jwt
from jose.exceptions import ExpiredSignatureError, JWTClaimsError, JWTError

# OIDC_ISSUER_URL: the issuer URL as it appears in tokens. Used to validate the
# `iss` claim and (when OIDC_BASE_URL is not set) to fetch the discovery document.
OIDC_ISSUER_URL = os.environ.get(
    "OIDC_ISSUER_URL", "http://localhost:8080"
)

# OIDC_BASE_URL: optional override for the base URL used to fetch the discovery
# document and JWKS. Set this to the container-internal hostname when the issuer
# URL visible to clients (OIDC_ISSUER_URL) differs from the URL reachable by the
# API process (e.g. split-horizon Docker networking).
# Defaults to OIDC_ISSUER_URL when not set.
_OIDC_BASE_URL = os.environ.get("OIDC_BASE_URL", OIDC_ISSUER_URL)

OIDC_VALID_AUDIENCES = set(
    a.strip()
    for a in os.environ.get("OIDC_VALID_AUDIENCES", "stuf-api,stuf-spa").split(",")
    if a.strip()
)

# Client ID of the SPA OIDC application. Used to distinguish user tokens (where
# azp matches the SPA client) from service-account tokens. Written to
# /bootstrap/generated.env by zitadel-init.
OIDC_SPA_CLIENT_ID = os.environ.get("OIDC_SPA_CLIENT_ID", "stuf-spa")

bearer_scheme = HTTPBearer(auto_error=False)

_discovery_doc: dict = {}
_jwks_cache: dict = {"keys": [], "fetched_at": 0.0}
_JWKS_TTL = 300  # seconds

# OIDC_ISSUER_HOST: when set, requests to the discovery document and JWKS
# endpoint are sent with this value as the Host header. Required when
# OIDC_BASE_URL is a Docker-internal hostname and the provider validates the
# Host header against its configured external domain (e.g. Zitadel in a
# split-horizon dev setup). Leave unset in standard deployments.
_issuer_host: str = os.environ.get("OIDC_ISSUER_HOST", "")


def _rebase_url(url: str) -> str:
    """Replace OIDC_ISSUER_URL prefix with _OIDC_BASE_URL for internal routing."""
    if _OIDC_BASE_URL != OIDC_ISSUER_URL and url.startswith(OIDC_ISSUER_URL):
        return _OIDC_BASE_URL + url[len(OIDC_ISSUER_URL):]
    return url


def _oidc_get(url: str) -> requests.Response:
    """GET an OIDC URL, routing through _OIDC_BASE_URL and spoofing Host when needed."""
    target = _rebase_url(url)
    headers = {"Host": _issuer_host} if _issuer_host else {}
    resp = requests.get(target, timeout=10, headers=headers)
    resp.raise_for_status()
    return resp

def _extract_roles(token_payload: dict) -> list:
    """Extract role list from a Zitadel token.

    Zitadel puts project roles at urn:zitadel:iam:org:project:roles
    as a dict of {role_key: {org_id: org_domain}}.
    """
    zitadel_roles = token_payload.get("urn:zitadel:iam:org:project:roles", {})
    if isinstance(zitadel_roles, dict):
        return list(zitadel_roles.keys())
    return []


def _fetch_discovery() -> dict:
    """Fetch and cache the OIDC discovery document."""
    global _discovery_doc
    if not _discovery_doc:
        url = f"{OIDC_ISSUER_URL}/.well-known/openid-configuration"
        _discovery_doc = _oidc_get(url).json()
    return _discovery_doc


def _get_jwks(force_refresh: bool = False) -> list:
    """Return cached JWKS keys, refreshing from the provider when stale or forced."""
    global _jwks_cache
    now = time.monotonic()
    if force_refresh or now - _jwks_cache["fetched_at"] > _JWKS_TTL:
        discovery = _fetch_discovery()
        _jwks_cache = {
            "keys": _oidc_get(discovery["jwks_uri"]).json().get("keys", []),
            "fetched_at": now,
        }
    return _jwks_cache["keys"]


def verify_jwt_token(token: str):
    """Verify and parse JWT token with proper signature validation"""
    logger = logging.getLogger(__name__)

    logger.info(f"Verifying JWT token (first 50 chars): {token[:50]}...")

    try:
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")
        if not kid:
            logger.error("JWT token missing key ID")
            return None

        # Try the cached JWKS first; on a cache miss force one refresh to handle
        # key rotation before giving up.
        public_key = None
        for force in (False, True):
            keys = _get_jwks(force_refresh=force)
            for key in keys:
                if key.get("kid") == kid:
                    public_key = jwk.construct(key)
                    break
            if public_key or force:
                break

        if not public_key:
            logger.error(f"Could not find public key for kid: {kid}")
            return None

        options = {
            "verify_aud": False,  # Handle audience validation manually below
            "verify_iss": True,
            "verify_exp": True,
        }

        token_payload = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            options=options,
            issuer=OIDC_ISSUER_URL,
        )

        token_aud = token_payload.get("aud", [])
        if isinstance(token_aud, str):
            token_aud = [token_aud]

        if not any(aud in OIDC_VALID_AUDIENCES for aud in token_aud):
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

    roles = _extract_roles(token_payload)

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

    roles = _extract_roles(token_payload)

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

    # Discriminate user vs service-account using identity claims.
    # Human user tokens carry email / given_name / family_name in the access
    # token; machine-user tokens do not.  This is simpler and more reliable
    # than inspecting scope or azp, which can include "openid" even for
    # machine users.
    has_user_fields = bool(
        token_payload.get("email")
        or token_payload.get("given_name")
        or token_payload.get("family_name")
        or token_payload.get("sid")  # session ID — human sessions only
    )

    if has_user_fields:
        logger.debug("Detected user token (has user identity fields)")
        return await get_current_user(token)
    else:
        logger.debug("Detected service account token (no user identity fields)")
        return await get_current_service_account(token)


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
