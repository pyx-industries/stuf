import asyncio
from unittest.mock import patch

import pytest
from fastapi.security import HTTPAuthorizationCredentials

from api.auth import middleware

PERSON = {"sub": "123", "preferred_username": "alice@example.com", "azp": "cli"}
MACHINE = {"sub": "456", "azp": "backup-service"}


def principal_for(payload):
    token = HTTPAuthorizationCredentials(scheme="Bearer", credentials="t")
    with patch.object(middleware, "verify_jwt_token", return_value=payload):
        return asyncio.run(middleware.get_current_principal(token))


@pytest.mark.unit
@pytest.mark.parametrize(
    "payload",
    [
        # From the SPA: profile claims and idtyp
        {**PERSON, "idtyp": "user", "email": "alice@example.com", "sid": "s"},
        # From another client, such as the device flow: idtyp, no profile claims
        {**PERSON, "idtyp": "user"},
        # An unknown idtyp is ignored, as if absent
        {**PERSON, "idtyp": "User", "email": "alice@example.com"},
        # From an IdP that doesn't set idtyp: profile claims only
        {**PERSON, "email": "alice@example.com"},
    ],
)
def test_person_is_recognised_by_preferred_username(payload):
    principal = principal_for(payload)
    assert principal.username == "alice@example.com"


@pytest.mark.unit
@pytest.mark.parametrize(
    "payload",
    [
        {**MACHINE, "idtyp": "app"},
        # idtyp decides even when a profile claim is present
        {**MACHINE, "idtyp": "app", "email": "backup@example.com"},
        # From an IdP that doesn't set idtyp: no profile claims
        MACHINE,
    ],
)
def test_service_account_is_recognised_by_client(payload):
    principal = principal_for(payload)
    assert principal.client_id == "backup-service"


@pytest.mark.unit
def test_person_without_username_is_recognised_by_sub():
    payload = {"sub": "123", "azp": "cli", "idtyp": "user", "collections": {}}
    assert principal_for(payload).username == "123"
