#!/usr/bin/env python3
"""
Zitadel provisioning script for STUF development environment.
Reads instance fixture from FIXTURE_PATH (default: /fixtures/dev/instance.yaml)
and mirrors it into Zitadel via the Management API.

Writes /bootstrap/login-token (PAT for zitadel-login) and
/bootstrap/generated.env (generated client IDs for step 5 wiring).
"""

import base64
import json
import os
import sys
import time
import uuid
from datetime import datetime, timezone, timedelta

import httpx
import jwt
import yaml
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.backends import default_backend

ZITADEL_DOMAIN = os.environ.get("ZITADEL_DOMAIN", "http://localhost:8080")
MACHINE_KEY_PATH = os.environ.get("MACHINE_KEY_PATH", "/bootstrap/zitadel-admin-sa.json")
BOOTSTRAP_DIR = os.environ.get("BOOTSTRAP_DIR", "/bootstrap")
FIXTURE_PATH = os.environ.get("FIXTURE_PATH", "/fixtures/dev/instance.yaml")

# Fired on the PRE_ACCESS_TOKEN_CREATION trigger (flow 2, trigger type 5).
# Fires for both authorization-code (human) and client_credentials (machine)
# grants when the project's access-token type is JWT.
# - preferred_username: not in Zitadel JWT access tokens by default; mirrors
#   the Keycloak claim the STUF API middleware reads.
# - collections: user metadata stored as a JSON object; getMetadata() returns
#   a wrapper {metadata: [...]} where each entry's value is already decoded
#   from base64+JSON (no atob/JSON.parse needed).
COLLECTIONS_ACTION_SCRIPT = """\
function preAccessTokenCreation(ctx, api) {
  if (ctx.v1.user.preferredLoginName) {
    api.v1.claims.setClaim("preferred_username", ctx.v1.user.preferredLoginName);
  }
  var result = ctx.v1.user.getMetadata();
  if (!result || !result.metadata) { return; }
  var md = result.metadata;
  for (var i = 0; i < md.length; i++) {
    if (md[i].key === "collections") {
      api.v1.claims.setClaim("collections", md[i].value);
      break;
    }
  }
}
"""


def load_fixture():
    with open(FIXTURE_PATH) as f:
        return yaml.safe_load(f)


def wait_for_machine_key(path, timeout=120):
    deadline = time.time() + timeout
    while time.time() < deadline:
        if os.path.exists(path):
            try:
                with open(path) as f:
                    data = json.load(f)
                if data.get("key") and data.get("userId"):
                    return data
            except (json.JSONDecodeError, KeyError):
                pass
        time.sleep(2)
    raise RuntimeError(f"Machine key not found at {path} after {timeout}s")


def get_issuer_url():
    for _ in range(30):
        try:
            resp = httpx.get(f"{ZITADEL_DOMAIN}/.well-known/openid-configuration", timeout=5)
            resp.raise_for_status()
            return resp.json()["issuer"]
        except Exception:
            time.sleep(2)
    raise RuntimeError("Could not reach Zitadel OIDC discovery endpoint")


def create_jwt_assertion(key_data, issuer_url):
    user_id = key_data["userId"]
    key_id = key_data["keyId"]
    private_key = serialization.load_pem_private_key(
        key_data["key"].encode(), password=None, backend=default_backend()
    )
    now = datetime.now(timezone.utc)
    payload = {
        "iss": user_id,
        "sub": user_id,
        "aud": [issuer_url],
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=5)).timestamp()),
        "jti": str(uuid.uuid4()),
    }
    return jwt.encode(payload, private_key, algorithm="RS256", headers={"kid": key_id})


def get_access_token(key_data, issuer_url):
    assertion = create_jwt_assertion(key_data, issuer_url)
    resp = httpx.post(
        f"{ZITADEL_DOMAIN}/oauth/v2/token",
        data={
            "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
            "assertion": assertion,
            "scope": "openid urn:zitadel:iam:org:project:id:zitadel:aud",
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    resp.raise_for_status()
    return resp.json()["access_token"]


def api(client, method, path, **kwargs):
    url = f"{ZITADEL_DOMAIN}{path}"
    resp = getattr(client, method)(url, **kwargs)
    if not resp.is_success:
        print(f"  ERROR: {method.upper()} {path} → {resp.status_code}")
        print(f"  {resp.text[:500]}")
        resp.raise_for_status()
    return resp.json() if resp.content else {}


def set_collections_metadata(client, user_id, collections):
    """Serialize collections dict to JSON, base64-encode, and store as metadata."""
    encoded = base64.b64encode(json.dumps(collections).encode()).decode()
    api(client, "post", f"/management/v1/users/{user_id}/metadata/collections",
        json={"value": encoded})


def main():
    print(f"Loading fixture from {FIXTURE_PATH} ...")
    fixture = load_fixture()

    print(f"Waiting for machine key at {MACHINE_KEY_PATH} ...")
    key_data = wait_for_machine_key(MACHINE_KEY_PATH)
    print(f"  Loaded key for user {key_data['userId']}")

    print("Fetching OIDC issuer URL ...")
    issuer_url = get_issuer_url()
    print(f"  Issuer: {issuer_url}")

    print("Obtaining access token ...")
    token = get_access_token(key_data, issuer_url)
    print("  OK")

    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    with httpx.Client(headers=headers, timeout=30.0) as client:

        # ── Project ───────────────────────────────────────────────────────────
        proj_cfg = fixture["project"]
        print(f"Creating project '{proj_cfg['name']}' ...")
        project = api(client, "post", "/management/v1/projects", json={
            "name": proj_cfg["name"],
            "projectRoleAssertion": True,
            "projectRoleCheck": False,
            "hasProjectCheck": False,
            "privateLabelingSetting": "PRIVATE_LABELING_SETTING_UNSPECIFIED",
        })
        project_id = project["id"]
        print(f"  project_id={project_id}")

        # ── Project roles ─────────────────────────────────────────────────────
        print("Creating project roles ...")
        for role in proj_cfg["roles"]:
            api(client, "post", f"/management/v1/projects/{project_id}/roles", json={
                "roleKey": role["key"],
                "displayName": role["displayName"],
                "group": "",
            })
            print(f"  {role['key']}")

        # ── OIDC application: spa ─────────────────────────────────────────────
        spa_cfg = fixture["apps"]["spa"]
        print(f"Creating OIDC app '{spa_cfg['name']}' ...")
        spa_app = api(client, "post", f"/management/v1/projects/{project_id}/apps/oidc", json={
            "name": spa_cfg["name"],
            "redirectUris": spa_cfg["redirectUris"],
            "responseTypes": ["OIDC_RESPONSE_TYPE_CODE"],
            "grantTypes": [
                "OIDC_GRANT_TYPE_AUTHORIZATION_CODE",
                "OIDC_GRANT_TYPE_REFRESH_TOKEN",
            ],
            "appType": "OIDC_APP_TYPE_USER_AGENT",
            "authMethodType": "OIDC_AUTH_METHOD_TYPE_NONE",
            "postLogoutRedirectUris": spa_cfg["postLogoutRedirectUris"],
            "version": "OIDC_VERSION_1_0",
            "accessTokenType": "OIDC_TOKEN_TYPE_JWT",
            "accessTokenRoleAssertion": True,
            "idTokenRoleAssertion": True,
            "idTokenUserinfoAssertion": True,
            "clockSkew": "0s",
            "additionalOrigins": [],
            "skipNativeAppSuccessPage": False,
        })
        spa_client_id = spa_app["clientId"]
        print(f"  client_id={spa_client_id}")

        # ── API application (audience target) ─────────────────────────────────
        api_cfg = fixture["apps"]["api"]
        print(f"Creating API app '{api_cfg['name']}' ...")
        api_app = api(client, "post", f"/management/v1/projects/{project_id}/apps/api", json={
            "name": api_cfg["name"],
            "authMethodType": "API_AUTH_METHOD_TYPE_PRIVATE_KEY_JWT",
        })
        api_app_client_id = api_app["clientId"]
        print(f"  client_id={api_app_client_id}")

        # ── Action: inject collections + preferred_username ───────────────────
        print("Creating 'injectCollections' action ...")
        action = api(client, "post", "/management/v1/actions", json={
            "name": "injectCollections",
            "script": COLLECTIONS_ACTION_SCRIPT,
            "timeout": "10s",
            "allowedToFail": True,
        })
        action_id = action["id"]
        print(f"  action_id={action_id}")

        # Flow type 2 = CUSTOMISE_TOKEN, trigger type 5 = PRE_ACCESS_TOKEN_CREATION
        api(client, "post", "/management/v1/flows/2/trigger/5", json={"actionIds": [action_id]})
        print("  trigger set (CUSTOMISE_TOKEN / PRE_ACCESS_TOKEN_CREATION)")

        # ── Human users ───────────────────────────────────────────────────────
        print("Processing human users ...")
        for user_def in fixture["human_users"]:
            if user_def.get("existing"):
                # Created by ZITADEL_FIRSTINSTANCE_*; look up by email, then
                # apply roles and collections metadata only.
                email = user_def["email"]
                search = api(client, "post", "/management/v1/users/_search", json={
                    "query": {"limit": 5, "asc": True},
                    "queries": [{"emailQuery": {
                        "emailAddress": email,
                        "method": "TEXT_QUERY_METHOD_EQUALS",
                    }}],
                })
                results = search.get("result", [])
                if not results:
                    print(f"  WARNING: existing user {email!r} not found; skipping")
                    continue
                user_id = results[0]["id"]
                print(f"  (existing) {email} → {user_id}")
            else:
                u = api(client, "post", "/management/v1/users/human", json={
                    "userName": user_def["username"],
                    "profile": {
                        "firstName": user_def["firstName"],
                        "lastName": user_def["lastName"],
                        "displayName": f"{user_def['firstName']} {user_def['lastName']}",
                        "preferredLanguage": "en",
                    },
                    "email": {
                        "email": user_def["email"],
                        "isEmailVerified": True,
                    },
                    "password": {
                        "value": user_def["password"],
                        "changeRequired": False,
                    },
                })
                user_id = u["userId"]
                print(f"  {user_def['username']} → {user_id}")

            if user_def.get("roles"):
                api(client, "post", f"/management/v1/users/{user_id}/grants", json={
                    "projectId": project_id,
                    "roleKeys": user_def["roles"],
                })

            if user_def.get("collections"):
                set_collections_metadata(client, user_id, user_def["collections"])

            if user_def.get("disabled"):
                # Newly-created users are in "initial" state and cannot be
                # deactivated; locking works across all states.
                api(client, "post", f"/management/v1/users/{user_id}/_lock", json={})
                print(f"    (locked)")

        # ── Machine users ─────────────────────────────────────────────────────
        print("Creating machine users ...")
        machine_client_id = None
        machine_client_secret = None
        for mu_def in fixture["machine_users"]:
            mu = api(client, "post", "/management/v1/users/machine", json={
                "userName": mu_def["username"],
                "name": mu_def["name"],
                "description": mu_def.get("description", ""),
                "accessTokenType": "ACCESS_TOKEN_TYPE_JWT",
            })
            mu_id = mu["userId"]
            print(f"  {mu_def['username']} → {mu_id}")

            if mu_def.get("roles"):
                api(client, "post", f"/management/v1/users/{mu_id}/grants", json={
                    "projectId": project_id,
                    "roleKeys": mu_def["roles"],
                })

            if mu_def.get("collections"):
                set_collections_metadata(client, mu_id, mu_def["collections"])

            secret_resp = api(client, "put", f"/management/v1/users/{mu_id}/secret", json={})
            machine_client_id = secret_resp.get("clientId", mu_def["username"])
            machine_client_secret = secret_resp.get("clientSecret", "")
            print(f"    client_id={machine_client_id}")

        # ── Login-client machine user (infrastructure, not in fixture) ────────
        print("Creating machine user 'login-client' for zitadel-login ...")
        login_user = api(client, "post", "/management/v1/users/machine", json={
            "userName": "login-client",
            "name": "Login Client",
            "description": "Service user for the Zitadel login UI",
            "accessTokenType": "ACCESS_TOKEN_TYPE_JWT",
        })
        login_user_id = login_user["userId"]
        print(f"  user_id={login_user_id}")

        api(client, "post", "/admin/v1/members", json={
            "userId": login_user_id,
            "roles": ["IAM_LOGIN_CLIENT"],
        })
        print("  Granted IAM_LOGIN_CLIENT")

        pat_resp = api(client, "post", f"/management/v1/users/{login_user_id}/pats", json={
            "expirationDate": "2099-01-01T00:00:00Z",
        })
        login_token = pat_resp["token"]
        print("  PAT generated")

        # ── Write bootstrap files ─────────────────────────────────────────────
        os.makedirs(BOOTSTRAP_DIR, exist_ok=True)

        token_file = os.path.join(BOOTSTRAP_DIR, "login-token")
        with open(token_file, "w") as f:
            f.write(login_token)
        os.chmod(token_file, 0o644)

        generated = {
            "ZITADEL_STUF_PROJECT_ID": project_id,
            "ZITADEL_SPA_CLIENT_ID": spa_client_id,
            "ZITADEL_API_APP_CLIENT_ID": api_app_client_id,
            "ZITADEL_BACKUP_SERVICE_CLIENT_ID": machine_client_id or "",
            "ZITADEL_BACKUP_SERVICE_CLIENT_SECRET": machine_client_secret or "",
        }
        env_file = os.path.join(BOOTSTRAP_DIR, "generated.env")
        with open(env_file, "w") as f:
            for k, v in generated.items():
                f.write(f"{k}={v}\n")
        os.chmod(env_file, 0o644)

        print("\n=== Provisioning complete ===")
        print(f"  project_id:           {project_id}")
        print(f"  spa_client_id:        {spa_client_id}")
        print(f"  api_app_client_id:    {api_app_client_id}")
        print(f"  backup client_id:     {machine_client_id}")
        print(f"  login-token written:  {token_file}")
        print(f"  generated.env:        {env_file}")
        print("=============================")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"\nFATAL: {e}", file=sys.stderr)
        sys.exit(1)
