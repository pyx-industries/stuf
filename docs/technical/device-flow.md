# Signing In Without a Browser: the Device Flow

A client with no browser of its own, such as a command-line tool or an agent
skill, can get a token for the STUF API **as the user running it** with the
OAuth 2.0 device authorization grant ([RFC 8628](https://www.rfc-editor.org/rfc/rfc8628)):

1. The client asks the identity provider for a device code.
2. The client shows the user a URL and a short code.
3. The user opens the URL in any browser, on any device, signs in and approves.
4. The client polls the identity provider until it gets the token.

STUF then treats the client exactly as it treats the user in the SPA: it
applies that user's collections, and records that user as the uploader of
what the client uploads. Use this, not a shared
[service account](service-accounts.md), for anything that acts on a person's
behalf: each person signs in as themselves, and can be revoked on their own.

## The client application in the identity provider

The client needs a public OIDC application (no client secret, since a secret
handed out with a tool is no secret) that is allowed the **Device Code** grant,
and the **Refresh Token** grant so that it need not ask the user again each
time the access token expires. Its access tokens must carry what any token for
STUF does:

- an audience STUF accepts (`OIDC_VALID_AUDIENCES`);
- the `collections` claim;
- `idtyp: user`, so that STUF identifies the person by `preferred_username`
  rather than taking the token for a service account's (see
  [service-accounts.md](service-accounts.md#how-stuf-tells-them-apart-the-idtyp-claim)).

In Zitadel this is a **Native** application in the STUF project, with the
Device Code and Refresh Token grants, authentication method None, and JWT
access tokens. A Native application without the Device Code grant is refused
with `unauthorized_client` (Zitadel says so when the client polls for the
token). Zitadel gives the tokens of any application in the
project the project's ID and its applications' client IDs as audiences, the
`stuf-api` application's included, and the `preAccessTokenCreation` Action
adds `collections` and `idtyp` to them as to any other token.

In the dev environment, `docker/zitadel-init/provision.py` creates this
application as `stuf-cli` and writes its client ID to
`.zitadel-bootstrap/generated.env` as `ZITADEL_CLI_CLIENT_ID`.

### Running it locally

Start the stack with `make spa-dev`. It provisions Zitadel, then starts the
API with the OIDC settings taken from `generated.env`: in particular
`OIDC_VALID_AUDIENCES`, set to the project's and applications' generated IDs,
which the token's `aud` carries. A plain `docker compose up` does not: its
API defaults to `OIDC_VALID_AUDIENCES=stuf-api,stuf-spa` (application names,
not IDs), and without `OIDC_ISSUER_HOST` Zitadel answers its request for the
discovery document with a 404, so it refuses every token. To run the API some other way, export what the `spa-dev` target does.

The user approves at the address in the device authorization response,
`http://localhost:8080/device`: sign in as one of the fixture's users (such as
`testuser` / `Password1!`), skip the offer to set up a second factor if it is
made, and allow the device.

## Getting a token

Everything the client needs is in the identity provider's discovery document,
`{issuer}/.well-known/openid-configuration`: the
`device_authorization_endpoint` and the `token_endpoint`. Ask for the
`offline_access` scope to get a refresh token.

A minimal Python script, taking the client ID as its argument and using only
`requests`:

```python
import sys
import time

import requests

ISSUER = "http://localhost:8080"     # the identity provider
CLIENT_ID = sys.argv[1]              # ZITADEL_CLI_CLIENT_ID in dev
API = "http://localhost:8000/api"    # STUF
DEVICE_GRANT = "urn:ietf:params:oauth:grant-type:device_code"

discovery = requests.get(f"{ISSUER}/.well-known/openid-configuration").json()

# 1. Ask for a device code.
response = requests.post(
    discovery["device_authorization_endpoint"],
    data={"client_id": CLIENT_ID, "scope": "openid offline_access"},
)
if not response.ok:  # invalid_client, say: an unknown client ID
    sys.exit(f"Device authorization failed: {response.text}")
device = response.json()

# 2. Show the user where to approve it.
print(f"Open {device['verification_uri']} and enter {device['user_code']}")

# 3 and 4. Poll for the token while the user approves.
interval = device.get("interval", 5)
deadline = time.time() + device["expires_in"]
while time.time() < deadline:
    time.sleep(interval)
    response = requests.post(
        discovery["token_endpoint"],
        data={
            "grant_type": DEVICE_GRANT,
            "device_code": device["device_code"],
            "client_id": CLIENT_ID,
        },
    )
    if response.ok:
        tokens = response.json()
        break
    error = response.json().get("error")
    if error == "slow_down":
        interval += 5
    elif error != "authorization_pending":
        sys.exit(f"Sign-in failed: {error}")
else:
    sys.exit("The code expired before it was approved")

# Call STUF as the user.
headers = {"Authorization": f"Bearer {tokens['access_token']}"}
print(requests.get(f"{API}/files/test", headers=headers).json())
```

Keep the refresh token where only the user can read it, and use it for a new
access token when the old one expires, rather than asking the user again:

```python
response = requests.post(
    discovery["token_endpoint"],
    data={
        "grant_type": "refresh_token",
        "refresh_token": tokens["refresh_token"],
        "client_id": CLIENT_ID,
    },
)
if not response.ok:  # invalid_grant: expired or revoked
    sys.exit("The sign-in has expired: run the device flow again")
tokens = response.json()
```

## Checking a token

`GET /api/me` with the token should show the user, not the client:

```json
{
  "type": "user",
  "username": "testuser",
  ...
}
```

If it shows `"type": "service_account"` and the client's ID instead, the token
has no `idtyp: user`; check that the Action is set on the identity provider's
access tokens for this application.
