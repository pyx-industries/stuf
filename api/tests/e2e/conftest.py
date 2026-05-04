import os
import sys
from pathlib import Path

import pytest
import requests
from fastapi.testclient import TestClient
from playwright.sync_api import sync_playwright

from api.main import app

# Add the browser E2E helpers to Python path for shared modules
browser_e2e_path = Path(__file__).parent.parent.parent.parent / "tests" / "e2e-browser"
if not browser_e2e_path.exists():
    # In Docker container, the helpers are in the current directory
    browser_e2e_path = Path(__file__).parent.parent.parent
sys.path.insert(0, str(browser_e2e_path))

# Import shared service health check fixture
try:
    from helpers.service_health import ensure_services_ready  # noqa: F401
except ImportError:
    # Fallback if import fails
    ensure_services_ready = None

# OIDC configuration — use discovery to find the token endpoint so the fixtures
# are provider-agnostic (works with both Keycloak and Zitadel).
OIDC_ISSUER_URL = os.environ.get("OIDC_ISSUER_URL", "http://keycloak-e2e:8080/realms/stuf")

# SPA URL for browser-based token acquisition.
# The test-runner container has Playwright+Chromium installed and the SPA is
# reachable on the Docker-internal network at the default below.
SPA_URL = os.environ.get("SPA_URL", "http://spa-e2e:3000")
SPA_HOST = SPA_URL.replace("http://", "").replace("https://", "")

# Scopes for service account (client_credentials) tokens.
# Override this env var when running against Zitadel.
OIDC_SERVICE_ACCOUNT_SCOPES = os.environ.get("OIDC_SERVICE_ACCOUNT_SCOPES", "stuf:access")

# Service-account credentials — written to /bootstrap/generated.env by zitadel-init
# for the Zitadel profile; defaults match the Keycloak realm-export.json fixture.
OIDC_SERVICE_ACCOUNT_CLIENT_ID = os.environ.get(
    "OIDC_SERVICE_ACCOUNT_CLIENT_ID",
    os.environ.get("ZITADEL_BACKUP_SERVICE_CLIENT_ID", "backup-service"),
)
OIDC_SERVICE_ACCOUNT_CLIENT_SECRET = os.environ.get(
    "OIDC_SERVICE_ACCOUNT_CLIENT_SECRET",
    os.environ.get("ZITADEL_BACKUP_SERVICE_CLIENT_SECRET", "backup-service-secret"),
)

_token_endpoint: str | None = None


def _get_token_endpoint() -> str:
    """Fetch the token endpoint from OIDC discovery (cached)."""
    global _token_endpoint
    if not _token_endpoint:
        try:
            resp = requests.get(
                f"{OIDC_ISSUER_URL}/.well-known/openid-configuration", timeout=10
            )
            resp.raise_for_status()
            _token_endpoint = resp.json()["token_endpoint"]
        except Exception:
            # Fallback for backwards compatibility when discovery is not reachable
            _token_endpoint = (
                f"{OIDC_ISSUER_URL}/protocol/openid-connect/token"
            )
    return _token_endpoint


def _get_user_token_via_browser(username: str, password: str) -> str:
    """Get an access token by completing the OIDC login flow through the SPA.

    Works with both Keycloak (single-step) and Zitadel (two-step) login UIs.
    Requires Playwright with Chromium (pre-installed in the test-runner container).
    """
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            page.goto(SPA_URL)
            page.wait_for_timeout(2000)

            # Trigger the OIDC redirect
            page.wait_for_selector('button:text("Sign in")', timeout=10000)
            page.click('button:text("Sign in")')

            # Wait for login form — combined selector handles both Keycloak and Zitadel
            combined = 'input[name="username"], input[name="loginName"]'
            page.wait_for_selector(combined, timeout=15000)

            if page.locator('input[name="loginName"]').count() > 0:
                # Zitadel two-step: login name → Next → password → Sign in
                page.fill('input[name="loginName"]', username)
                page.click('button[type="submit"]')
                page.wait_for_selector('input[name="password"]', timeout=10000)
                page.fill('input[name="password"]', password)
                page.click('button[type="submit"]')
            else:
                # Keycloak single-step
                page.fill('input[name="username"]', username)
                page.fill('input[name="password"]', password)
                page.click('button[type="submit"], input[type="submit"]')

            # Wait for the OIDC callback redirect back to the SPA
            page.wait_for_url(f"*{SPA_HOST}*", timeout=15000)
            # Give oidc-client-ts time to exchange the auth code for tokens
            page.wait_for_timeout(3000)

            token_data = page.evaluate("""
                () => {
                    const key = Object.keys(localStorage).find(
                        k => k.startsWith('oidc.user:')
                    );
                    if (!key) return null;
                    try { return JSON.parse(localStorage.getItem(key)); }
                    catch { return null; }
                }
            """)

            if not token_data or "access_token" not in token_data:
                keys = page.evaluate("() => Object.keys(localStorage)")
                raise RuntimeError(
                    f"No access_token in localStorage after login as {username}. "
                    f"localStorage keys: {keys}"
                )

            return token_data["access_token"]
        finally:
            browser.close()


@pytest.fixture(scope="session")
def user_token(ensure_services_ready):  # noqa: F811
    """Get a real user token via browser-based OIDC login."""
    try:
        return _get_user_token_via_browser("testuser@example.com", "password")
    except Exception as e:
        pytest.skip(f"Could not get user token via browser login: {e}")


@pytest.fixture(scope="session")
def limited_user_token(ensure_services_ready):  # noqa: F811
    """Get a token for a user with limited permissions via browser-based OIDC login."""
    try:
        return _get_user_token_via_browser("limiteduser@example.com", "password")
    except Exception as e:
        pytest.skip(f"Could not get limited user token via browser login: {e}")


@pytest.fixture
def e2e_client():
    """TestClient for E2E tests - NO MOCKS, depends on real services being up"""
    return TestClient(app)


@pytest.fixture
def e2e_authenticated_client(e2e_client, user_token):
    """Authenticated client for E2E tests"""
    e2e_client.headers.update({"Authorization": f"Bearer {user_token}"})
    return e2e_client


@pytest.fixture
def e2e_limited_client(e2e_client, limited_user_token):
    """Limited user client for E2E tests"""
    e2e_client.headers.update({"Authorization": f"Bearer {limited_user_token}"})
    return e2e_client


@pytest.fixture
def service_account_token(ensure_services_ready):  # noqa: F811
    """Get a real service account token using the client credentials grant."""

    data = {
        "grant_type": "client_credentials",
        "client_id": OIDC_SERVICE_ACCOUNT_CLIENT_ID,
        "client_secret": OIDC_SERVICE_ACCOUNT_CLIENT_SECRET,
        "scope": OIDC_SERVICE_ACCOUNT_SCOPES,
    }

    response = requests.post(_get_token_endpoint(), data=data)

    if response.status_code != 200:
        pytest.skip(
            f"Could not get service account token from IDP: {response.text}"
        )

    return response.json()["access_token"]


@pytest.fixture
def e2e_service_account_client(e2e_client, service_account_token):
    """Service account client for E2E tests"""
    e2e_client.headers.update({"Authorization": f"Bearer {service_account_token}"})
    return e2e_client
