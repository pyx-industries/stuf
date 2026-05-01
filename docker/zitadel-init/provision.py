#!/usr/bin/env python3
"""
Zitadel provisioning script for STUF development environment.
Mirrors the content of docker/keycloak/data/import/realm-export.json.

Run order: after Zitadel is healthy, before api/spa/zitadel-login start.
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
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.backends import default_backend

ZITADEL_DOMAIN = os.environ.get("ZITADEL_DOMAIN", "http://localhost:8080")
MACHINE_KEY_PATH = os.environ.get("MACHINE_KEY_PATH", "/bootstrap/zitadel-admin-sa.json")
BOOTSTRAP_DIR = os.environ.get("BOOTSTRAP_DIR", "/bootstrap")
ZITADEL_ADMIN_EMAIL = os.environ.get("ZITADEL_ADMIN_EMAIL", "admin@example.com")

# Injected into every access token via the preAccessTokenCreation trigger.
# - preferred_username: not in Zitadel JWT access tokens by default; mirrors
#   the Keycloak claim the STUF API middleware reads.
# - collections: user metadata injected as a JSON object claim; mirrors the
#   Keycloak stuf:access scope's collections attribute mapper.
# Metadata values arrive as base64-encoded strings in ctx.v1.user.metadataList.
COLLECTIONS_ACTION_SCRIPT = """\
function preAccessTokenCreation(ctx, api) {
  api.v1.claims.setClaim("preferred_username", ctx.v1.user.preferredLoginName);
  var md = ctx.v1.user.metadataList;
  if (!md) { return; }
  for (var i = 0; i < md.length; i++) {
    if (md[i].key === "collections") {
      try {
        api.v1.claims.setClaim("collections", JSON.parse(atob(md[i].value)));
      } catch (e) {}
      break;
    }
  }
}
"""

HUMAN_USERS = [
    {
        "username": "testuser",
        "firstName": "Test",
        "lastName": "User",
        "email": "testuser@example.com",
        "password": "password",
        "roles": ["project-participant"],
        "collections": '{"test":["read","write","delete"],"collection-1-docs":["read","write"],"collection-2-contracts":["read"],"collection-3-cat-pics":["read","write","delete"]}',
    },
    {
        "username": "test-admin",
        "firstName": "Test",
        "lastName": "Admin",
        "email": "admin@test.example.com",
        "password": "test-password",
        "roles": ["admin"],
        "collections": '{"test":["read","write","delete"],"restricted":["read","write","delete"],"shared":["read","write","delete"]}',
    },
    {
        "username": "test-trust-architect",
        "firstName": "Test",
        "lastName": "Architect",
        "email": "ta@test.example.com",
        "password": "test-password",
        "roles": ["trust-architect"],
        "collections": '{"test":["read","write","delete"],"restricted":["read","write","delete"],"shared":["read","write","delete"]}',
    },
    {
        "username": "test-user-full",
        "firstName": "Test",
        "lastName": "FullUser",
        "email": "full@test.example.com",
        "password": "test-password",
        "roles": ["project-participant"],
        "collections": '{"test":["read","write"],"restricted":["read","write"],"shared":["read","write"]}',
    },
    {
        "username": "test-user-limited",
        "firstName": "Test",
        "lastName": "LimitedUser",
        "email": "limited@test.example.com",
        "password": "test-password",
        "roles": ["project-participant"],
        "collections": '{"test":["read","write"]}',
    },
    {
        "username": "test-user-shared",
        "firstName": "Test",
        "lastName": "SharedUser",
        "email": "shared@test.example.com",
        "password": "test-password",
        "roles": ["project-participant"],
        "collections": '{"shared":["read","write"]}',
    },
    {
        "username": "test-user-inactive",
        "firstName": "Test",
        "lastName": "InactiveUser",
        "email": "inactive@test.example.com",
        "password": "test-password",
        "roles": ["project-participant"],
        "collections": '{"test":["read","write"]}',
        "disabled": True,
    },
]


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
    for attempt in range(30):
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
    private_key_pem = key_data["key"]

    private_key = serialization.load_pem_private_key(
        private_key_pem.encode(),
        password=None,
        backend=default_backend(),
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


def set_user_metadata(client, user_id, key, value_str):
    encoded = base64.b64encode(value_str.encode()).decode()
    api(client, "post", f"/management/v1/users/{user_id}/metadata/{key}", json={"value": encoded})


def main():
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

        # ── Project ──────────────────────────────────────────────────────────
        print("Creating project 'stuf' ...")
        project = api(client, "post", "/management/v1/projects", json={
            "name": "stuf",
            "projectRoleAssertion": True,
            "projectRoleCheck": False,
            "hasProjectCheck": False,
            "privateLabelingSetting": "PRIVATE_LABELING_SETTING_UNSPECIFIED",
        })
        project_id = project["id"]
        print(f"  project_id={project_id}")

        # ── Project roles ─────────────────────────────────────────────────────
        print("Creating project roles ...")
        role_defs = [
            ("admin", "Administrator"),
            ("trust-architect", "Trust Architect"),
            ("project-participant", "Project Participant"),
            ("collection-test", "Collection Test"),
            ("service", "Service Account"),
        ]
        for role_key, display_name in role_defs:
            api(client, "post", f"/management/v1/projects/{project_id}/roles", json={
                "roleKey": role_key,
                "displayName": display_name,
                "group": "",
            })
            print(f"  {role_key}")

        # ── OIDC application: stuf-spa ─────────────────────────────────────
        print("Creating OIDC app 'stuf-spa' ...")
        spa_app = api(client, "post", f"/management/v1/projects/{project_id}/apps/oidc", json={
            "name": "stuf-spa",
            "redirectUris": [
                "http://localhost:3000",
                "http://localhost:3100",
                "http://spa-e2e:3000",
            ],
            "responseTypes": ["OIDC_RESPONSE_TYPE_CODE"],
            "grantTypes": [
                "OIDC_GRANT_TYPE_AUTHORIZATION_CODE",
                "OIDC_GRANT_TYPE_REFRESH_TOKEN",
            ],
            "appType": "OIDC_APP_TYPE_USER_AGENT",
            "authMethodType": "OIDC_AUTH_METHOD_TYPE_NONE",
            "postLogoutRedirectUris": [
                "http://localhost:3000",
                "http://localhost:3100",
                "http://spa-e2e:3000",
            ],
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
        spa_app_id = spa_app["appId"]
        print(f"  client_id={spa_client_id}")

        # ── API application: stuf-api (audience target) ─────────────────────
        print("Creating API app 'stuf-api' ...")
        api_app = api(client, "post", f"/management/v1/projects/{project_id}/apps/api", json={
            "name": "stuf-api",
            "authMethodType": "API_AUTH_METHOD_TYPE_PRIVATE_KEY_JWT",
        })
        api_app_client_id = api_app["clientId"]
        print(f"  client_id={api_app_client_id}")

        # ── Action: inject collections + preferred_username ──────────────────
        print("Creating 'injectCollections' action ...")
        action = api(client, "post", "/management/v1/actions", json={
            "name": "injectCollections",
            "script": COLLECTIONS_ACTION_SCRIPT,
            "timeout": "10s",
            "allowedToFail": True,
        })
        action_id = action["id"]
        print(f"  action_id={action_id}")

        # Flow type 2 = CUSTOMISE_TOKEN, trigger type 4 = PRE_ACCESS_TOKEN_CREATION
        api(client, "post", "/management/v1/flows/2/trigger/4", json={"actionIds": [action_id]})
        print("  trigger set (CUSTOMISE_TOKEN / PRE_ACCESS_TOKEN_CREATION)")

        # ── Update existing admin user (created by first-instance) ───────────
        # Search by email; FIRSTINSTANCE_ORG_HUMAN_USERNAME sets the loginName
        # but the internal userName may include an org suffix in some versions.
        print(f"Looking up first-instance admin user (email={ZITADEL_ADMIN_EMAIL}) ...")
        search_resp = api(client, "post", "/management/v1/users/_search", json={
            "query": {"limit": 5, "asc": True},
            "queries": [{"emailQuery": {
                "emailAddress": ZITADEL_ADMIN_EMAIL,
                "method": "TEXT_QUERY_METHOD_EQUALS",
            }}],
        })
        admin_results = search_resp.get("result", [])
        if admin_results:
            admin_user_id = admin_results[0]["id"]
            print(f"  Found admin user_id={admin_user_id}")
            api(client, "post", f"/management/v1/users/{admin_user_id}/grants", json={
                "projectId": project_id,
                "roleKeys": ["admin"],
            })
            set_user_metadata(client, admin_user_id, "collections",
                '{"test":["read","write","delete"],"restricted":["read","write","delete"],"shared":["read","write","delete"]}')
            print("  Granted admin role + set collections")
        else:
            print("  WARNING: first-instance admin user not found; skipping")

        # ── Human test users ──────────────────────────────────────────────────
        print("Creating human test users ...")
        for user_def in HUMAN_USERS:
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
                set_user_metadata(client, user_id, "collections", user_def["collections"])

            if user_def.get("disabled"):
                # Newly-created users are in "initial" state and cannot be
                # deactivated; locking works across all states.
                api(client, "post", f"/management/v1/users/{user_id}/_lock", json={})
                print(f"    (locked)")

        # ── Machine user: backup-service ──────────────────────────────────────
        print("Creating machine user 'backup-service' ...")
        backup_user = api(client, "post", "/management/v1/users/machine", json={
            "userName": "backup-service",
            "name": "Backup Service",
            "description": "Service account for backup operations",
            "accessTokenType": "ACCESS_TOKEN_TYPE_JWT",
        })
        backup_user_id = backup_user["userId"]
        print(f"  user_id={backup_user_id}")

        api(client, "post", f"/management/v1/users/{backup_user_id}/grants", json={
            "projectId": project_id,
            "roleKeys": ["service"],
        })
        set_user_metadata(client, backup_user_id, "collections", '{"test":["read"],"shared":["read"]}')

        # Generate client credentials for backup-service
        secret_resp = api(client, "put", f"/management/v1/users/{backup_user_id}/secret", json={})
        backup_client_id = secret_resp.get("clientId", backup_user_id)
        backup_client_secret = secret_resp.get("clientSecret", "")
        print(f"  client_id={backup_client_id}")

        # ── Machine user: login-client (IAM_LOGIN_CLIENT) ─────────────────────
        print("Creating machine user 'login-client' for zitadel-login ...")
        login_user = api(client, "post", "/management/v1/users/machine", json={
            "userName": "login-client",
            "name": "Login Client",
            "description": "Service user for the Zitadel login UI",
            "accessTokenType": "ACCESS_TOKEN_TYPE_JWT",
        })
        login_user_id = login_user["userId"]
        print(f"  user_id={login_user_id}")

        # Grant IAM_LOGIN_CLIENT role (admin API)
        api(client, "post", "/admin/v1/members", json={
            "userId": login_user_id,
            "roles": ["IAM_LOGIN_CLIENT"],
        })
        print("  Granted IAM_LOGIN_CLIENT")

        # Generate PAT (expiry far in future for dev)
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
            "ZITADEL_BACKUP_SERVICE_CLIENT_ID": backup_client_id,
            "ZITADEL_BACKUP_SERVICE_CLIENT_SECRET": backup_client_secret,
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
        print(f"  backup client_id:     {backup_client_id}")
        print(f"  login-token written:  {token_file}")
        print(f"  generated.env:        {env_file}")
        print("=============================")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"\nFATAL: {e}", file=sys.stderr)
        sys.exit(1)
