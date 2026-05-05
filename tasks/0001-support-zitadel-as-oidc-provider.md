# 0001 — Support Zitadel as the OIDC provider

**Status:** investigation (no code changes proposed yet)
**Issue:** [#85](https://github.com/gosource/stuf/issues/85)

## Goal

Today STUF's auth path is Keycloak-shaped end-to-end: the API middleware
templates Keycloak realm URLs by hand, the SPA's OIDC authority is
`${keycloakUrl}/realms/${keycloakRealm}`, the realm-export JSON in
`docker/keycloak/data/import/realm-export.json` is the only identity-model
fixture, and the e2e helpers know about realm paths and Keycloak-login
selectors. We want STUF to be deployable against
[Zitadel](https://github.com/zitadel/zitadel) without forking the API. This
note enumerates everything in STUF that has to move before that can be true,
plus the design questions that need answers first.

The intent is not to *remove* Keycloak from the dev stack here — only to make
the API and SPA OIDC-provider-agnostic enough that swapping the bundled
identity service for `ghcr.io/zitadel/zitadel` (or pointing at an external
Zitadel) is a config change rather than a code change. The dev compose can
keep using Keycloak as the default until the parallel Zitadel path is proven.

## Latest stable Zitadel image

Confirmed from the GitHub releases API (not training data):

- **Latest stable:** `ghcr.io/zitadel/zitadel:v4.14.0`, published 2026-04-24.
  (`v5.0.0-base` is a pre-release placeholder.)
- The matching login-UI image is `ghcr.io/zitadel/zitadel-login:v4.14.0`.
  Zitadel v4 splits the OIDC API and the login screens into two containers;
  both must use the same version tag.
- The official compose example
  (`https://raw.githubusercontent.com/zitadel/zitadel/main/deploy/compose/docker-compose.yml`)
  currently pins `v4.13.0` in its `.env.example`. We can pin `v4.14.0`
  initially and track upstream's pin going forward.

## What's currently wired to Keycloak

Files referencing Keycloak today (from a repo grep for `keycloak`/`KEYCLOAK_`):

- `docker-compose.yml` — the `keycloak` service plus `KEYCLOAK_URL`,
  `KEYCLOAK_ISSUER_URL`, `KEYCLOAK_REALM`, `KEYCLOAK_CLIENT_ID`,
  `KEYCLOAK_CLIENT_SECRET` env vars on `api` and `spa`. The bundled
  `docker/keycloak/Dockerfile` builds an optimized `quay.io/keycloak/keycloak`
  image with health-checks enabled.
- `tests/e2e-browser/docker-compose.e2e-browser.yml` — second copy of the
  same wiring under `keycloak-e2e` (port 8180, port-suffix scheme avoids
  clashing with the dev stack on 8080).
- `docker/keycloak/data/import/realm-export.json` (373 lines) — the entire
  identity model: realm `stuf`; realm roles (`admin`, `trust-architect`,
  `project-participant`, `collection-test`, `service`); the `stuf:access`
  client scope with audience mapper (`stuf-api`), `collections` JSON
  attribute mapper, and `preferred_username` mapper; clients `stuf-spa`
  (public, PKCE), `stuf-api` (confidential, service accounts enabled),
  `backup-service` (service-account-only); test users with per-user
  `collections` JSON attribute encoding `{collection: [perms]}`.
- `api/auth/middleware.py` — JWT validation (manual JWKS fetch via
  `requests`, RS256, issuer `${KEYCLOAK_ISSUER_URL}/realms/${REALM}`,
  audiences `{stuf-api, stuf-spa}`, roles from `realm_access.roles`,
  custom `collections` claim); also templates the `token`,
  `userinfo`, `introspect` and `certs` URLs by hand.
- `api/domain/models.py` — `ServiceAccount.client_id` is documented as
  "Unique client identifier from Keycloak" but the model itself is
  provider-neutral.
- `spa/src/config.ts`, `spa/src/index.tsx`, `spa/docker-entrypoint.sh` —
  read `keycloakUrl`/`keycloakRealm`/`keycloakClientId` from
  `window.__STUF_CONFIG__` (injected at container start), and build the
  OIDC `authority` as `${keycloakUrl}/realms/${keycloakRealm}` with
  scope `openid profile email stuf:access`.
- `spa/src/hooks/user/useUser.ts` — reads `preferred_username`,
  `given_name`, `family_name`, `email`, and the custom `collections`
  claim out of `auth.user.profile` (the parsed id-token).
- `api/tests/e2e/conftest.py`,
  `api/tests/e2e/test_auth_e2e.py`,
  `api/tests/e2e/test_service_account_e2e.py`,
  `api/tests/integration/conftest.py`,
  `api/tests/fixtures/test_data.py` — fixtures hit
  `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token` for
  password-grant and client-credentials grants; integration mocks shape
  payloads with `realm_access.roles` and `preferred_username`.
- `tests/e2e-browser/config.py`, `tests/e2e-browser/conftest.py`,
  `tests/e2e-browser/helpers/service_health.py`,
  `tests/e2e-browser/pages/login_page.py`,
  `tests/e2e-browser/step_definitions/authentication_steps.py` —
  Playwright login page object whose selectors
  (`input[name="username"]`, `input[name="password"]`,
  `button[type="submit"]`, `.alert-error, #input-error,
  .kc-feedback-text`) are Keycloak-form-specific, plus URL waits on
  `realms/stuf/protocol/openid-connect/auth*`.
- `tests/run.sh` — `wait_for_keycloak()` polls the Keycloak management
  health endpoint and the realm URL.
- `Makefile`, `README.md`, `mkdocs.yml`/`docs/` — wording, admin-console
  links, "Keycloak realm `stuf`" references in onboarding docs.

## How Zitadel concepts map onto the current Keycloak setup

Zitadel does **not** have a "realm" concept. Its hierarchy is:

```
Instance  →  Organization(s)  →  Project(s)  →  Application(s) (OIDC / SAML / API)
                                            →  Project Role(s)
                              →  Human User(s) / Machine User(s)
```

| Keycloak concept                          | Zitadel equivalent                                                           |
|-------------------------------------------|------------------------------------------------------------------------------|
| Realm `stuf`                              | Project `stuf` on the default Organization on the default Instance           |
| Public client `stuf-spa`                  | OIDC application (User-Agent, PKCE, no secret) on the project                |
| Confidential client `stuf-api`            | API application (used as audience target; not a token issuer for users)      |
| Service-account client `backup-service`   | Machine user (with client-secret or private-key JWT) granted project roles   |
| Realm role (`admin`, `trust-architect`…)  | Project role (defined on the project, granted to users)                      |
| Client scope `stuf:access`                | No 1:1 equivalent — its three responsibilities split apart (see below)       |
| `collections` user attribute (JSON)       | User metadata + a Zitadel **Action** that injects it into the token          |
| Audience mapper (`stuf-api`)              | Request the scope `urn:zitadel:iam:org:project:id:{projectId}:aud` so the project's API-application client IDs land in `aud` |
| Realm import JSON                         | No direct equivalent — see "Provisioning" below                              |

The `stuf:access` Keycloak client scope today bundles three things into one
opt-in token: an audience mapper, the JSON `collections` attribute mapper, and
a `preferred_username` mapper. In Zitadel each of those becomes a separate
moving part:

- The audience claim is requested via the well-known scope
  `urn:zitadel:iam:org:project:id:{projectId}:aud`.
- `collections` becomes a custom claim emitted by a Zitadel **Action**
  (server-side JS) on the `preAccessTokenCreation` trigger reading user
  metadata.
- `preferred_username` lives in the id token / userinfo by default; getting
  it into the access token requires the per-application "User Info inside
  Token" setting.

The mismatch around the `collections` claim and the namespaced roles claim is
the largest functional gap and the most likely place where the migration needs
explicit design decisions (see "Open questions").

## OIDC endpoint and token-shape differences

These changes touch every consumer (API middleware, SPA, e2e fixtures, browser
e2e):

- **Issuer URL.** Keycloak: `http://localhost:8080/realms/stuf`. Zitadel:
  `http://localhost:8080` (no realm path segment).
- **Discovery.** Keycloak:
  `http://localhost:8080/realms/stuf/.well-known/openid-configuration`. Zitadel:
  `http://localhost:8080/.well-known/openid-configuration` (root). STUF today
  does not call discovery at all — every endpoint is hand-built. The
  cheapest path forward is to switch to discovery so the URL shape stops
  being a code-level concern.
- **Authorize.** `/realms/stuf/protocol/openid-connect/auth` →
  `/oauth/v2/authorize`.
- **Token.** `/realms/stuf/protocol/openid-connect/token` →
  `/oauth/v2/token`.
- **JWKS.** `/realms/stuf/protocol/openid-connect/certs` → `/oauth/v2/keys`.
- **UserInfo.** `/realms/stuf/protocol/openid-connect/userinfo` →
  `/oidc/v1/userinfo`.
- **Introspect.** `/realms/stuf/protocol/openid-connect/token/introspect` →
  `/oauth/v2/introspect`. STUF imports the Keycloak introspect URL at module
  level (`api/auth/middleware.py:29-31`) but never actually calls it — JWT
  signature validation is used instead. The dead URL can simply be removed.
- **Default access-token format is opaque**, not JWT. The current middleware
  decodes RS256 JWTs via JWKS — which only works if each
  application/service-user is set to issue JWT access tokens (Zitadel
  per-application setting `accessTokenType: JWT`). This must be set on
  every application and service user that produces tokens for the API,
  or the middleware has to switch to `/oauth/v2/introspect` (extra round
  trip per request, plus the API would need its own Zitadel credentials
  to call introspect).
- **Roles claim.** Keycloak puts roles at `realm_access.roles` (flat list).
  Zitadel puts project roles at `urn:zitadel:iam:org:project:roles` (object:
  `{ "<role-key>": { "<orgId>": "<orgPrimaryDomain>" } }`). The middleware's
  `roles = realm_access.get("roles", [])` extraction must read from both
  shapes (or from a normalised abstraction).
- **Audience.** By default Zitadel includes the project ID and the project's
  application client IDs in `aud`. To make a token usable by a specific
  backend, the SPA / service must request the scope
  `urn:zitadel:iam:org:project:id:{projectId}:aud` at token time. The
  middleware's hard-coded `valid_audiences = {"stuf-api", "stuf-spa"}` will
  become the client IDs Zitadel auto-generates for those applications
  (UUID-ish values), so it must be driven off env vars rather than literals.
- **`preferred_username` and `email`** are not in Zitadel access tokens by
  default — only in id tokens / userinfo. The middleware's username fallback
  (`preferred_username` → `username` → `sub`) will end up using `sub` unless
  the project is configured to also assert profile claims in the access
  token (per-application setting "User Info inside Token"). The SPA's
  `useUser` hook reads from `auth.user.profile`, which `react-oidc-context`
  populates from the id token, so the SPA path is less affected — but
  `preferred_username` still has to be in the id token, which it is by
  default.
- **Token-type discrimination.** `get_current_principal`
  (`api/auth/middleware.py:323-361`) decides "user vs service account" using
  Keycloak-specific heuristics: `azp != "stuf-spa"`, `sid` field presence,
  absence of `openid`/`profile`/`email` from `scope`. Under Zitadel
  `azp == "stuf-spa"` will never match (auto-generated UUID-ish ID) and
  `sid` is named differently, so the heuristic effectively breaks. The
  cleanest fix is to discriminate on a deterministic claim — Zitadel sets
  `urn:zitadel:iam:org:project:roles` for users with project roles and
  emits a different shape for machine users; or simply trust
  `azp`-points-at-the-machine-user-id.

## Provisioning the Zitadel "realm" content

Zitadel's `FirstInstance` YAML/env mechanism only seeds: one Org name, one
Human admin, optionally one IAM_OWNER Machine user, optionally one
Login-Client Machine user. It cannot pre-create projects, applications,
roles, additional users, or groups. The `realm-export.json` we ship today
has no direct analogue.

The standard pattern is:

1. Configure `ZITADEL_FIRSTINSTANCE_*` env vars so the boot creates an
   IAM_OWNER machine user with a **machine key** (or PAT) written to a
   shared volume — e.g.
   `ZITADEL_FIRSTINSTANCE_MACHINEKEYPATH=/machinekey/zitadel-admin-sa.json`,
   `ZITADEL_FIRSTINSTANCE_ORG_MACHINE_MACHINE_USERNAME=zitadel-admin-sa`,
   `ZITADEL_FIRSTINSTANCE_ORG_MACHINE_MACHINEKEY_TYPE=1`.
2. After Zitadel reports healthy, run a one-shot init container that reads
   that key and uses the Management API
   (`http://zitadel:8080/management/v1/...`) to create the project,
   applications, roles, users, user metadata (for `collections`), the
   `preAccessTokenCreation` Action, and grants.

Two implementation options:

- **Option A: Terraform** with the official
  [`zitadel/zitadel`](https://github.com/zitadel/terraform-provider-zitadel)
  provider, run inside an init container. Pros: declarative, diffable
  state, the community's preferred path. Cons: extra binary, terraform
  state has to live somewhere, harder for a first-time reader to debug.
- **Option B: a small Python script** in `docker/zitadel-init/` that loads
  the machine key, mints a JWT, and POSTs the project / applications /
  users / Action to the Management API. Pros: same toolchain as the rest
  of `api/`, easy to iterate on, output mirrors the JSON realm-export
  pattern we already have. Cons: idempotency is on us.

For a dev-only fixture (we already ship JSON for Keycloak), Option B is
likely the lower-friction choice, with `httpx` to share a dependency with
the existing API code. The script's input would live at
`docker/zitadel-init/dev/instance.yaml` (or `.json`) and would be roughly
the same shape as `realm-export.json` but expressed in Zitadel terms
(project, applications, project roles, machine users, human users with
metadata for `collections`).

## Concrete code/config changes required

1. **`docker-compose.yml`** —
   - Add three new services: `zitadel` (image
     `ghcr.io/zitadel/zitadel:v4.14.0`, command `start-from-init --masterkey
     "${ZITADEL_MASTERKEY}"`), `zitadel-login` (image
     `ghcr.io/zitadel/zitadel-login:v4.14.0`), and a `zitadel-postgres`
     instance (Zitadel requires Postgres). A shared `zitadel-bootstrap`
     named volume carries the IAM machine key and the login client's PAT
     between containers.
   - Add a `zitadel-init` one-shot service that depends on `zitadel` being
     healthy and runs the provisioning script. The `api` and `spa` services
     should depend on `zitadel-init: condition: service_completed_successfully`
     when the active profile is `zitadel`, so they don't try to validate
     tokens before clients exist.
   - Generalise the env var names on `api` and `spa` from `KEYCLOAK_*` to
     `OIDC_*` (`OIDC_ISSUER_URL`, `OIDC_DISCOVERY_URL` or just
     `OIDC_ISSUER_URL` plus discovery), and read the per-service
     `*_CLIENT_ID` / `*_CLIENT_SECRET` env vars from the bootstrap output
     of the init container (since Zitadel auto-generates client IDs and
     secrets — see "Open questions"). Compose profiles can keep Keycloak
     as the default and `zitadel` as an opt-in.

2. **`docker/keycloak/`** — keep for the default profile. Add
   `docker/zitadel-init/` containing the provisioning Dockerfile, the init
   script, and the YAML/JSON fixture describing the project.

3. **`api/auth/middleware.py`** — generalise to OIDC discovery:
   - Read a single `OIDC_ISSUER_URL` (e.g. `http://localhost:8080` for
     Zitadel, `http://localhost:8080/realms/stuf` for Keycloak) and fetch
     the issuer's `.well-known/openid-configuration`. Use `jwks_uri`,
     `issuer`, and (if needed) `introspection_endpoint` from the discovery
     document instead of templating URL paths by hand.
   - Cache the JWKS rather than fetching it on every request (the current
     code does — silent perf bug already, but more visible once the
     issuer is on a different network).
   - Replace the hard-coded
     `valid_audiences = {"stuf-api", "stuf-spa"}` with an env-driven set
     so the Zitadel-generated client IDs can be plugged in
     (`OIDC_VALID_AUDIENCES` as a comma-separated list).
   - Replace the Keycloak-shaped roles extraction (`realm_access.roles`)
     with logic that also reads `urn:zitadel:iam:org:project:roles` — a
     dict whose keys are role names — when present.
   - Replace the principal-discrimination heuristic in
     `get_current_principal` with something provider-agnostic. Cleanest
     option: have the API's auth flow be told the SPA's client ID via
     env (`OIDC_SPA_CLIENT_ID`) and treat `azp == OIDC_SPA_CLIENT_ID` (or
     presence of human-only claims like `email_verified` / `sid`) as the
     user marker, with everything else treated as a service account.
   - Drop the unused `introspect_endpoint` module-level constant.

4. **`spa/src/config.ts` + `spa/src/index.tsx` + `spa/docker-entrypoint.sh`** —
   - Replace the `keycloakUrl/keycloakRealm/keycloakClientId` triple with
     `oidcAuthority` + `oidcClientId` (and an optional `oidcExtraScopes`
     list). The provider-specific authority shape moves out of the SPA
     and into the entrypoint that injects the runtime config.
   - Update the OIDC scope list. For Zitadel: drop `stuf:access`
     (Keycloak-only client scope) and add the project-audience and roles
     scopes
     (`urn:zitadel:iam:org:project:id:${ZITADEL_STUF_PROJECT_ID}:aud
     urn:zitadel:iam:org:projects:roles`). For Keycloak the existing
     `openid profile email stuf:access` keeps working.
   - The runtime-config injection in `docker-entrypoint.sh` needs analogous
     renames; both providers can be supported by emitting `oidcAuthority`
     directly (the entrypoint, not the SPA, picks the realm shape).

5. **`spa/src/hooks/user/useUser.ts`** — `preferred_username`, `email`,
   `given_name`, `family_name` are id-token claims and are present in both
   providers, so this hook needs no change. Document it as such (the file
   currently calls these "Keycloak preferred_username" which is incorrect
   — they are standard OIDC claims).

6. **`api/domain/models.py`** — update the docstring on
   `ServiceAccount.client_id` to drop the "from Keycloak" wording. No code
   change needed; the model is already provider-neutral.

7. **`api/tests/e2e/conftest.py`** — *(Implemented — PRs #90, #91)*
   - Token endpoint resolved via OIDC discovery (`/.well-known/openid-configuration`)
     rather than templated Keycloak realm path.
   - ROPC removed entirely. User tokens (`user_token`, `limited_user_token`) are
     now obtained by driving a real browser login through the SPA with Playwright
     (headless Chromium). Provider detection (Keycloak single-step vs Zitadel
     two-step) is handled inline; the test-runner container already has
     Playwright + Chromium installed and the SPA is on the same Docker network,
     so no new infrastructure was needed.
   - Service-account tokens still use `client_credentials` via `requests`
     (works for both providers).
   - `OIDC_SERVICE_ACCOUNT_SCOPES` remains env-configurable for Zitadel's
     audience+roles scopes vs Keycloak's `stuf:access`.

8. **`api/tests/integration/conftest.py` +
   `api/tests/fixtures/test_data.py`** — *(Implemented — step 8)*
   - `mock_jwt_verification` already had Zitadel-shaped tokens for user, admin, and
     service account from a prior partial implementation.
   - Added `zitadel-limited-user-integration-test-token` and `zitadel_limited_user_headers`
     fixture.
   - Extended `AUTH_FIXTURES` in `test_files_api.py` with `zitadel_authenticated_headers` and
     `zitadel_service_account_headers`; extended `LIMITED_AUTH_FIXTURES` with
     `zitadel_limited_user_headers`.
   - Fixed `get_current_principal` in `api/auth/middleware.py`: simplified from a
     complex `has_service_indicators` check (which broke for Zitadel machine users
     that include `openid` in their scope) to a single `has_user_fields` discriminant.
     Human tokens carry `email`/`given_name`/`family_name`; machine tokens do not —
     this is reliable across both providers.

9. **`tests/e2e-browser/pages/login_page.py`** — *(Implemented — step 5/branch 85-zitadel-3)*
   `login_page.py` was fully updated with Zitadel-login v4 selectors and a two-step
   login flow (login-name → Next → password → Sign in). Provider detection is URL-based:
   `/ui/v2/login/` → Zitadel, `/realms/` → Keycloak.

10. **`tests/e2e-browser/pages/login_page.py:27-30, 119-124` +
    `tests/e2e-browser/conftest.py:122`** — *(Implemented — step 8)*
    - `conftest.py` `authenticated_page` fixture updated to use `LoginPage.login_with_admin_user()`
      instead of hardcoded Keycloak selectors. Provider detection and two-step flow handled inside
      `LoginPage`.
    - `authentication_steps.py` `enter_valid_admin_credentials` and `enter_invalid_credentials`
      updated to use `LoginPage` selectors and handle Zitadel two-step flow inline.
    - `assert_on_idp_page` already checks for both `/ui/v2/login/` and `/realms/` (no Keycloak-only
      URL match remains).

11. **`tests/run.sh`** — *(Implemented — branch 85-zitadel-3)*
    `wait_for_keycloak` replaced with `wait_for_idp` that polls Zitadel's `/debug/healthz`,
    Keycloak's `/health/ready`, and the generic OIDC discovery endpoint as a fallback.

12. **`docker-compose.e2e.yml` +
    `tests/e2e-browser/docker-compose.e2e-browser.yml`** — *(Implemented — step 8)*
    - `docker-compose.e2e.yml`: added `keycloak` profile to the Keycloak service; added full
      Zitadel stack (`zitadel-postgres`, `zitadel-bootstrap-init`, `zitadel`, `zitadel-init`,
      `zitadel-login`) under `zitadel` profile using `network_mode: host` (same as main compose).
    - `tests/e2e-browser/docker-compose.e2e-browser.yml`: added `keycloak` profile to
      `keycloak-e2e`; added full Zitadel stack under `zitadel` profile running on the bridge
      network with `ZITADEL_EXTERNALDOMAIN=zitadel-e2e` so the Playwright browser inside the
      test-runner container can reach it by hostname (ports 8280/8290). The `api-e2e`, `spa-e2e`,
      and `test-runner` services now use `${VAR:-keycloak-default}` env var substitution so they
      can be configured for either provider without changing the compose file.
    - Bootstrap volume changed to a bind-mount (`tests/e2e-browser/.zitadel-bootstrap/`) for the
      e2e-browser stack so `generated.env` is accessible to the Makefile.
    - `make test-e2e` updated to use `--profile keycloak`; `make test-e2e-zitadel` added to
      source `generated.env` and start all services with the correct Zitadel-specific env vars.
    - **Known limitation**: `OIDC_VALID_AUDIENCES` and SPA `OIDC_CLIENT_ID` depend on
      Zitadel-generated IDs from `generated.env`. See open question #3 — these must be sourced
      from `.zitadel-bootstrap/generated.env` after init completes; `make test-e2e-zitadel`
      handles this automatically.

13. **`Makefile`, `README.md`, `mkdocs.yml`, `docs/`** — *(Implemented — step 8)*
    - `CLAUDE.md` updated: Docker commands now use `--profile keycloak`/`--profile zitadel`;
      authentication section made provider-agnostic; development URLs now list both Keycloak and
      Zitadel admin consoles; dependency description updated from "Keycloak via python-jose" to
      "OIDC via python-jose".
    - `Makefile`: `make test-e2e` uses `--profile keycloak`; `make test-e2e-zitadel` added;
      `clean` and `spa-stop` targets also clean the Zitadel e2e bootstrap directory.
    - `README.md` already mentions both providers (updated in earlier branch).
    - `docs/` and `mkdocs.yml` references to Keycloak are in historical/planning docs
      (`docs/mvp.md`) and left as-is (they describe the MVP design, not current state).

## Open questions / blockers

These need decisions or upstream investigation before implementation:

1. **Custom `collections` claim.** The current authorisation logic reads a
   per-user JSON `collections` claim that encodes per-collection
   read/write/delete rights. Zitadel has no Keycloak-style attribute mapper;
   the equivalent is a Zitadel **Action** (server-side JavaScript) attached
   to the `preAccessTokenCreation` (and `preUserinfoCreation`, if the SPA
   needs it in the id token) trigger that reads user metadata and writes a
   custom claim. We need to (a) decide if `collections` stays as a custom
   claim or moves to a different model (Zitadel project roles, scopes, or
   per-collection roles) and (b) write the Action if we keep it. Sticking
   with the custom claim is the lowest-diff path; modelling collections as
   project roles would invert the data model (one role per
   `{collection}:{permission}` combination) and is likely overkill for a
   mostly-attribute-based model.
   **Resolved (step 4).** Keeping the custom claim. The `injectCollections`
   Action (in `docker/zitadel-init/provision.py`) is deployed to the
   `CUSTOMISE_TOKEN / PRE_ACCESS_TOKEN_CREATION` trigger. It reads the
   `collections` key from user metadata (base64-decoded JSON) and injects
   it as a top-level claim. It also injects `preferred_username` from
   `ctx.v1.user.preferredLoginName` to fill the gap Zitadel has vs Keycloak.
   Note: the Action fires for authorisation-code flows; behaviour on
   `client_credentials` flows needs verification in step 5.

2. **JWT vs opaque tokens.** Default Zitadel access tokens are opaque. Two
   options:
   - (a) Configure `accessTokenType: JWT` per application — preserves the
     current RS256/JWKS middleware essentially as-is.
   - (b) Switch the middleware to call Zitadel's `/oauth/v2/introspect`
     endpoint — the API would need its own Zitadel credentials and pay a
     round-trip per request.
   Recommend (a). It is also closer to the current Keycloak behaviour, so
   the same middleware path works for both providers.
   **Resolved (step 4).** `stuf-spa` is created with `accessTokenType:
   OIDC_TOKEN_TYPE_JWT` and `idTokenUserinfoAssertion: true`. The API app
   uses `API_AUTH_METHOD_TYPE_PRIVATE_KEY_JWT`. The `backup-service` machine
   user is created with `ACCESS_TOKEN_TYPE_JWT`.

3. **Auto-generated client IDs.** Zitadel does not let you choose the
   client ID for an OIDC application — it's a generated identifier. That
   means the API's audience allow-list and the SPA's `client_id` must be
   plumbed from the init step's output (e.g. into an `.env` file or as
   updated compose env vars), rather than the stable string literals
   (`stuf-api`, `stuf-spa`, `backup-service`) we use today. This is the
   single biggest ergonomic regression from the operator's perspective.
   **Partially resolved (step 4).** `zitadel-init` writes the generated IDs
   to `/bootstrap/generated.env` (named volume `zitadel-bootstrap`). For
   step 5, compose needs to read these values into `api` and `spa` env vars.
   One option: after `zitadel-init` completes, a second one-shot container
   copies `generated.env` to a host-bound path so compose can pick it up
   via `env_file`. Another option: wire env vars via `docker compose run`.
   Exception: `backup-service` machine user's `clientId` IS the userName
   (`backup-service`), so it is stable across restarts — only the secret
   rotates.

4. **Service account credentials.** `backup-service` today has a
   well-known `clientId=backup-service` and `secret=backup-service-secret`
   in `realm-export.json`, used directly in
   `api/tests/e2e/conftest.py`. Zitadel machine users get either a
   client-secret (auto-generated) or a private-key JWT. The init script
   has to write the resulting credentials to a place the e2e fixture can
   read — likely an `.env` file mounted into the test container.
   **Partially resolved (step 4).** `backup-service` machine user created;
   client credentials (`clientId=backup-service`, auto-generated secret)
   written to `/bootstrap/generated.env`. `client_credentials` token flow
   verified working. E2E fixture wiring deferred to step 5.

5. **Token-type discrimination semantics.** `get_current_principal`'s
   distinction between user tokens and service-account tokens is the most
   provider-coupled piece of the middleware. The Zitadel-correct move is
   to drive it off `azp` against a known SPA client ID (read from env)
   rather than off Keycloak-specific scopes. Worth confirming this is
   acceptable to STUF's API consumers — anyone calling the API today
   with a Keycloak token whose `azp` is something else (a third
   non-`stuf-spa` user-facing client?) would be reclassified as a
   service account under a strict `azp == OIDC_SPA_CLIENT_ID` rule.

6. **Discovery-based middleware vs hand-built URLs.** Switching the API
   to OIDC discovery is a larger refactor than just renaming env vars,
   but it's the change that decouples STUF from any one provider for
   good. Worth doing as the foundation step rather than retrofitting
   Zitadel-specific URL templates beside the Keycloak ones.
   **Resolved (step 1).** `api/auth/middleware.py` now fetches the JWKS
   URI from `OIDC_BASE_URL/.well-known/openid-configuration` and has no
   provider-specific URL construction.

7. **Storage choice for Zitadel.** Zitadel requires Postgres. STUF's
   compose has no Postgres today. A dedicated `zitadel-postgres` service
   keeps this self-contained; it can be on the `zitadel` profile so the
   default Keycloak path stays unaffected.
   **Resolved (step 3).** `zitadel-postgres` (Postgres 17) added to
   `docker-compose.yml` under the `zitadel` profile. Default Keycloak
   path is unaffected.

8. **Compose-profile strategy.** The cleanest way to ship parallel
   provider support is `docker compose --profile keycloak up` (today's
   default) vs `docker compose --profile zitadel up`. That keeps both
   stacks importable for e2e and avoids the operator having to comment
   out services. Worth confirming the e2e harness's expectations of
   service names — `keycloak-e2e` is hard-coded in several Playwright
   fixtures and would have to become provider-parameterised or
   provider-renamed.
   **Partially resolved (step 3 + step 4).** Profile strategy implemented:
   `--profile keycloak` starts Keycloak on :8080; `--profile zitadel`
   starts the Zitadel stack on :8080/:8090; bare `docker compose up`
   starts minio/api/spa only. The e2e service-name issue (hardcoded
   `keycloak-e2e` in Playwright fixtures) remains open for step 6.
   Additional discovery (step 4): Zitadel validates the HTTP `Host` header
   on every incoming request against `ZITADEL_EXTERNALDOMAIN` (localhost).
   Any Docker-internal request using the service hostname (`zitadel:8080`)
   returns "Instance not found". Fix: `zitadel-init` and `zitadel-login`
   both use `network_mode: host` so they call `http://localhost:8080`
   directly (the published port) — the `Host` header matches. For step 5,
   `api` will also need either host networking or a proxy, or the env var
   `OIDC_BASE_URL` must use `localhost` rather than `zitadel`.
   `zitadel-login` uses `PORT` env var to bind on 8090 instead of the
   default 3000.

9. **API e2e user-token acquisition under Zitadel.** *(Resolved — 2026-05-04)*
   The ROPC-based `real_keycloak_token` / `limited_keycloak_token` fixtures were
   replaced with Playwright browser-based login (`user_token` /
   `limited_user_token`).  The test-runner container already has Playwright +
   Chromium installed and the SPA is on the same Docker network, so no new
   infrastructure was needed.  Provider detection (Keycloak single-step vs
   Zitadel two-step) is handled inline in `conftest.py`, mirroring the logic
   already in `login_page.py`.  ROPC is no longer used anywhere in the test
   suite.

## Suggested implementation order

Once the open questions above are answered, a low-risk sequence is:

1. Refactor `api/auth/middleware.py` to use OIDC discovery and an
   env-driven audience allow-list, while still pointing at Keycloak.
   No behaviour change; this is purely the "untangle the URL builder"
   step.
2. Refactor the SPA config to expose `oidcAuthority` directly,
   computing it in `docker-entrypoint.sh` rather than in
   `index.tsx`. Again, no behaviour change.
3. Stand up Zitadel + Postgres + login UI in compose under a `zitadel`
   profile, with no consumers wired up. Verify the admin console is
   reachable at `http://localhost:8080/ui/console` and the OIDC
   discovery URL responds.
4. Land the `zitadel-init` provisioning step (project, roles, applications,
   machine users, Action for `collections`) that mirrors the
   `realm-export.json` content.
5. Switch a single test environment to the Zitadel profile end-to-end:
   `api` middleware against Zitadel-issued JWTs, SPA driving Zitadel
   login, and the API e2e fixtures using Zitadel's token endpoint.
6. Rebuild the Playwright login page object against Zitadel-login's DOM
   and add a CI matrix entry that runs the browser e2e suite under both
   providers.
7. Documentation and operator-facing rename of env vars.

This sequence keeps Keycloak working through every step and lets us bail
out at any point without the dev stack regressing.

---

## Current state of branch (as of 2026-05-05)

Branch: `85-zitadel-5` — PR #92.

Steps 1–6 are fully implemented and all Zitadel e2e tests pass. Below is a
summary of what was fixed and what works.

### What works

- Provider-agnostic API middleware (OIDC discovery + JWT verification).
- `docker-compose.yml` and `docker-compose.e2e-browser.yml` both have a
  `--profile zitadel` path with the full Nginx-proxied Zitadel stack
  (postgres → zitadel-backend → nginx → zitadel-login).
- `docker/zitadel-init/provision.py` provisions the project, roles, OIDC
  apps, action (collections claim injection), human users, machine users,
  and the login-client PAT.
- `make test-e2e-zitadel` orchestrates a clean bring-up and runs both API
  e2e and browser e2e test suites.
- Browser e2e fixture (`conftest.py`) does live Playwright login for
  user-token tests; service-account tokens use client-credentials grant.
- Playwright `LoginPage` handles Zitadel's two-step login (login-name page
  → Continue → password page) alongside Keycloak's single-step form.
- Machine user collection permissions are extracted from Zitadel project
  role names (`col-{collection}-{perm}`) and from the
  `STUF_MACHINE_USER_COLLECTIONS` env var written by `zitadel-init`
  (Zitadel v4 cannot inject custom claims into `client_credentials` tokens).

### Root causes found and fixed

**1. First-instance admin had `passwordChangeRequired=true`**

Zitadel always creates the `ZITADEL_FIRSTINSTANCE_ORG_HUMAN_*` admin with
`passwordChangeRequired=true`. The Management API `POST
/management/v1/users/{id}/password` with `changeRequired: false` returns
200 but does not clear this flag (confirmed by v2 `GET /v2/users/{id}`
still showing `"passwordChangeRequired": true`).

Fix: added `ZITADEL_FIRSTINSTANCE_ORG_HUMAN_PASSWORDCHANGEREQUIRED: "false"`
to both `docker-compose.yml` and `docker-compose.e2e-browser.yml`. This
prevents the flag from being set at initialization time.

**2. Provisioned users stuck in `USER_STATE_INITIAL`**

`provision.py` used the Management v1 API (`/management/v1/users/human`)
which always creates users in `USER_STATE_INITIAL` regardless of whether
`isEmailVerified` is set. Zitadel Login v2 shows **"Initial User not
supported"** for INITIAL-state users and cannot log them in.

Fix: switched to the v2 API (`/v2/users/human`) with
`email.isAlreadyVerified: true`. This creates users in `USER_STATE_ACTIVE`
directly. The v2 profile uses `givenName`/`familyName` (not
`firstName`/`lastName`) and the password field is `password` (not `value`).
Role grants and metadata calls continue to use the Management v1 API (user
IDs are consistent across both API versions).

**3. BDD step `login_as_user_type` did not handle Zitadel's two-step login**

The step called `fill_password` immediately after `fill_username`, before
clicking Continue to advance to the password page. Fixed to detect
`_is_zitadel()` and insert the intermediate click + wait.

Also fixed the admin password in this step: Zitadel requires `Password1!`
(complexity policy), not `password`.

**4. Machine user tokens carry no `collections` claim in Zitadel v4**

Zitadel v4 actions cannot inject custom claims into `client_credentials`
tokens. Fixed in two layers:

- `api/auth/middleware.py` extracts collection permissions from project role
  names (`col-{collection}-{perm}`) assigned during provisioning.
- `zitadel-init` writes a `STUF_MACHINE_USER_COLLECTIONS` env var
  (base64-encoded JSON) to `generated.env` as a fallback; the middleware
  reads it at startup.

### Test results (all passing after all fixes)

| Test | Result |
|------|--------|
| `test_auth_flow_with_screenshots.py` | ✅ PASSED |
| `test_authentication_bdd::test_successful_login_with_valid_credentials` | ✅ PASSED |
| `test_authentication_bdd::test_login_failure_with_invalid_credentials` | ✅ PASSED |
| `test_authentication_bdd::test_successful_logout` | ✅ PASSED |
| `test_authentication_bdd::test_direct_access_to_protected_route_when_not_authenticated` | ✅ PASSED |
| `test_authentication_bdd::test_authentication_with_different_user_roles` | ✅ PASSED |
| API e2e (non-browser) | ✅ 58 passed, 8 skipped |

The 8 skips are user-token API tests that require a logged-in user JWT;
they are not yet wired up in the API e2e fixtures (separate task).

### Open Zitadel behaviour notes (for future reference)

- The Management v1 password endpoint (`POST
  /management/v1/users/{id}/password`) returns 200 for ACTIVE users but
  **silently ignores `changeRequired: false`** if the account-level
  `passwordChangeRequired` flag was set at initialization. The v2
  `GET /v2/users/{id}` response field `passwordChangeRequired` is the
  authoritative check.
- INITIAL-state users cannot have their password set, deactivated, or
  reactivated via the Management API — they can only be deleted.
- The `ZITADEL_FIRSTINSTANCE_ORG_HUMAN_PASSWORDCHANGEREQUIRED` env var
  defaults to `true`; always set it to `"false"` in dev/test stacks.
