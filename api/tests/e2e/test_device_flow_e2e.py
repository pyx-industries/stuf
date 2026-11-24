import io
import os

import pytest
import requests

from api.auth.middleware import verify_jwt_token
from api.tests.e2e.conftest import OIDC_ISSUER_URL

# Written by zitadel-init: the stuf-cli client ID, and the login UI's PAT,
# which may drive Zitadel's session and device authorization APIs as a login
# UI does.
BOOTSTRAP_DIR = os.environ.get("ZITADEL_BOOTSTRAP_DIR", "/bootstrap")
DEVICE_GRANT = "urn:ietf:params:oauth:grant-type:device_code"


def _bootstrap():
    with open(f"{BOOTSTRAP_DIR}/generated.env") as f:
        env = dict(line.strip().split("=", 1) for line in f if "=" in line)
    with open(f"{BOOTSTRAP_DIR}/login-token") as f:
        return env["ZITADEL_CLI_CLIENT_ID"], f.read().strip()


@pytest.fixture(scope="module")
def device_flow_token(ensure_services_ready):  # noqa: F811
    """A token for testuser from the device flow, approved without a browser."""
    client_id, login_pat = _bootstrap()
    discovery = requests.get(
        f"{OIDC_ISSUER_URL}/.well-known/openid-configuration", timeout=10
    ).json()
    device = requests.post(
        discovery["device_authorization_endpoint"],
        data={"client_id": client_id, "scope": "openid offline_access"},
        timeout=10,
    )
    device.raise_for_status()
    device = device.json()

    # Approve as the user, as the login UI does: find the request by its user
    # code, sign the user in with a session, and authorise the request with it.
    login = requests.Session()
    login.headers["Authorization"] = f"Bearer {login_pat}"
    request = login.get(
        f"{OIDC_ISSUER_URL}/v2/oidc/device_authorization/{device['user_code']}",
        timeout=10,
    )
    request.raise_for_status()
    session = login.post(
        f"{OIDC_ISSUER_URL}/v2/sessions",
        json={"checks": {
            "user": {"loginName": "testuser"},
            "password": {"password": "Password1!"},
        }},
        timeout=10,
    )
    session.raise_for_status()
    session = session.json()
    login.post(
        f"{OIDC_ISSUER_URL}/v2/oidc/device_authorization/"
        f"{request.json()['deviceAuthorizationRequest']['id']}",
        json={"session": {
            "sessionId": session["sessionId"],
            "sessionToken": session["sessionToken"],
        }},
        timeout=10,
    ).raise_for_status()

    response = requests.post(
        discovery["token_endpoint"],
        data={
            "grant_type": DEVICE_GRANT,
            "device_code": device["device_code"],
            "client_id": client_id,
        },
        timeout=10,
    )
    assert response.ok, response.json().get("error")
    return response.json()["access_token"]


@pytest.fixture
def device_flow_client(e2e_client, device_flow_token):
    e2e_client.headers.update({"Authorization": f"Bearer {device_flow_token}"})
    return e2e_client


@pytest.mark.e2e
class TestDeviceFlowE2E:
    """A client without a browser signs in as the user with the device flow."""

    def test_token_is_the_users(self, device_flow_token):
        token_info = verify_jwt_token(device_flow_token)

        assert token_info is not None
        assert token_info.get("idtyp") == "user"
        assert "write" in token_info["collections"]["test"]

    def test_me_reports_the_user(self, device_flow_client):
        me = device_flow_client.get("/api/me").json()

        assert me["type"] == "user"
        assert me["username"] == "testuser"

    def test_upload_records_the_user_as_uploader(self, device_flow_client):
        response = device_flow_client.post(
            "/api/files/test",
            files={"file": ("device-flow.txt", io.BytesIO(b"hello"), "text/plain")},
        )

        assert response.status_code == 200
        assert response.json()["metadata"]["uploader"] == "testuser"
