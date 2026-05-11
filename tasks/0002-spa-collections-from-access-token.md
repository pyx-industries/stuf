# SPA collections claim: fetch from API instead of decoding tokens

## Problem

`useUser.ts` reads `collections` from `auth.user.profile.collections`. In
`oidc-client-ts` the `profile` is built from the **ID token** (when
`loadUserInfo: false`) or from the **userinfo endpoint response** (when
`loadUserInfo: true`).

**Keycloak** — works today because the `stuf:access` scope mapper is configured
with `id.token.claim: true`, `access.token.claim: true`, and
`userinfo.token.claim: true` simultaneously. `collections` appears in all three.
The SPA defaults to `OIDC_LOAD_USER_INFO=false` for Keycloak, so the profile
comes from the ID token, which has the claim.

**Zitadel** — the `PRE_ACCESS_TOKEN_CREATION` action (trigger 5) injects
`collections` into the **access token only**. The ID token is created
separately and does not receive custom action claims. The userinfo endpoint
response is driven by granted scopes, not by the access-token payload, so it
returns `urn:zitadel:iam:user:metadata` when that scope is requested but never
a top-level `collections` claim. The Makefile therefore sets
`OIDC_LOAD_USER_INFO=true` for Zitadel, but the userinfo response still does
not contain `collections`.

**Consequence of the branch-5a simplification:** the
`urn:zitadel:iam:user:metadata` fallback was removed from `parseCollections()`
in `useUser.ts`. That fallback was the only way the SPA had previously been
able to surface collections under Zitadel. Removing it broke the browser BDD
test `test_file_upload_bdd.py::test_upload_a_valid_file_into_a_collection`
(assertion: "Could not find collection 'test'" because the SPA showed no
collections for the logged-in admin user).

The service-account tests all pass — the API reads `collections` directly from
the JWT access token, which trigger 5 populates correctly. The gap is
SPA-only.

## Key observation

The `/api/me` endpoint already exists and returns `collections` in its response
(alongside `username`, `email`, `full_name`, `roles`, `active`). The API reads
`collections` directly from the validated access token, which is the one place
both providers always have the claim:

| Token / endpoint      | Keycloak | Zitadel (trigger 5) |
|-----------------------|----------|---------------------|
| Access token          | ✓        | ✓                   |
| ID token              | ✓        | ✗                   |
| Userinfo response     | ✓        | ✗                   |

The SPA can call `/api/me` on login to get collections rather than trying to
extract them from the OIDC token or profile — removing all token-decoding logic
from the SPA and keeping the API as the single authoritative source.

## Options

### Option A — Read `collections` from the decoded access token

Change `useUser.ts` to decode `auth.user.access_token` and read `collections`
from its payload, while continuing to read `username`, `email`, `name`, etc.
from `auth.user.profile` (ID token / userinfo) as today.

**Pros:**
- Single provider-agnostic code path — no Keycloak / Zitadel branches
- `OIDC_LOAD_USER_INFO` can revert to `false` for Zitadel
- No extra network round-trip

**Cons:**
- Decoding the access token in the SPA is slightly unusual (it is opaque in
  some architectures)
- Still requires provider-specific knowledge to know which token holds the claim

### Option B — Bind a second action to the Zitadel userinfo flow

Register an additional action on the Zitadel userinfo flow so that when the
userinfo endpoint is called, `collections` is also injected into the response.

**Pros:** `useUser.ts` continues reading from `profile.collections` unchanged

**Cons:**
- Two action registrations in `provision.py` (one for access-token, one for
  userinfo)
- The userinfo flow context may have a different shape from the access-token
  flow context (needs its own investigation)
- `OIDC_LOAD_USER_INFO=true` must remain set for Zitadel
- More moving parts for equivalent result

### Option C — Restore the `urn:zitadel:iam:user:metadata` fallback

Re-add the `urn:zitadel:iam:user:metadata` parsing to `parseCollections()` in
`useUser.ts`, and keep the `urn:zitadel:iam:user:metadata` scope in the Zitadel
OIDC scope string.

**Pros:** Minimal change; well-understood path

**Cons:**
- Reverts the "collapse to one path" goal from branch 5a
- Keeps Zitadel-specific logic in the SPA
- The metadata value returned by the userinfo endpoint is still base64-encoded
  JSON (the userinfo endpoint does not decode it the way the action context
  does), so the decoding chain (`atob` + `JSON.parse`) must remain

### Option D — Fetch collections from `/api/me` (recommended)

On login (when `auth.isAuthenticated` becomes true), call `GET /api/me` with
the access token as a Bearer header. Store the returned `collections` in React
state alongside the other user fields.

**Pros:**
- The SPA never decodes or inspects tokens — clean separation of concerns
- Removes all provider-specific collection logic from the SPA entirely
- The API is the single authoritative source (it already validates the token
  and resolves collections for every other endpoint)
- `OIDC_LOAD_USER_INFO` can revert to `false` for both providers; no userinfo
  call needed at all
- `parseCollections()` and all related token-inspection code can be deleted

**Cons:**
- One extra network round-trip on login (minor; `/api/me` is cheap)

## Recommended path

Option D. The `/api/me` endpoint already returns `collections`; using it
removes all token-decoding logic from the SPA, eliminates provider-specific
branching, and keeps the API as the single source of truth for authorization
data. Combine with:

- Removing `parseCollections()` and the `collections` extraction from
  `useUser.ts`
- Reverting `OIDC_LOAD_USER_INFO` to `false` for Zitadel in the Makefile and
  docker-compose, since the userinfo call is no longer needed

## Where to implement

**Branch: `85-zitadel-5a` (PR #93).** The regression was introduced there when
`parseCollections()` was simplified in `useUser.ts`. The SPA OIDC env-var
changes (`OIDC_LOAD_USER_INFO`, `OIDC_SCOPE`) are also in 5a. Fixing it there
means 5b and 5c (which build on top of 5a) inherit the correct behaviour
automatically, and the Zitadel browser E2E tests added in 5c should pass
without any further changes.
