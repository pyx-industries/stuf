"""Simple smoke test for basic connectivity."""

import httpx
from playwright.sync_api import Page
from config import SPA_URL, API_URL, KEYCLOAK_URL


class TestBasicConnectivity:
    """Basic connectivity tests without full authentication flow."""

    def test_all_services_responding(self):
        """Test that all services are responding to basic requests."""
        # Test API
        with httpx.Client() as client:
            response = client.get(f"{API_URL}/api/health", timeout=10.0)
            assert response.status_code == 200
            assert "healthy" in response.json().get("status", "")

        # Test SPA
        with httpx.Client() as client:
            response = client.get(SPA_URL, timeout=10.0)
            assert response.status_code == 200
            assert "STUF" in response.text

        # Test Keycloak basic response
        with httpx.Client() as client:
            response = client.get(KEYCLOAK_URL, timeout=10.0)
            # Keycloak may return various status codes, just ensure it responds
            assert response.status_code < 500  # Any response better than server error

    def test_spa_loads_in_browser(self, page: Page):
        """Test that the SPA loads successfully in browser."""
        # Navigate to SPA
        page.goto(SPA_URL)

        # Wait for page to load
        page.wait_for_load_state("networkidle", timeout=15000)

        # Verify we're on the SPA
        from config import SPA_HOST

        assert SPA_HOST in page.url
        assert page.title() == "STUF"

        # Verify React app has initialized (no critical JS errors)
        # The fact that we can get the title suggests React loaded

    def test_spa_shows_unauthenticated_state(self, page: Page):
        """Test that SPA shows appropriate state when user is not authenticated."""
        page.goto(SPA_URL)
        page.wait_for_load_state("networkidle", timeout=15000)

        # The page should load without errors
        from config import SPA_HOST

        assert SPA_HOST in page.url
        assert page.title() == "STUF"

        # Check that we see some evidence of authentication handling
        console_messages = []
        page.on("console", lambda msg: console_messages.append(msg.text))

        # Reload to capture console messages from start
        page.reload()
        page.wait_for_load_state("networkidle", timeout=15000)

        # Look for any authentication-related console messages
        auth_related = [
            msg
            for msg in console_messages
            if any(keyword in msg.lower() for keyword in ["auth", "oidc", "user"])
        ]

        # Should see some authentication handling in console
        assert (
            len(auth_related) > 0
        ), "Should see some authentication-related console activity"

    def test_basic_oidc_redirect_available(self, page: Page):
        """Test that OIDC redirect mechanism is available (without full auth)."""
        # Try to navigate to a URL that might trigger OIDC redirect
        # This depends on how the SPA is configured
        page.goto(f"{SPA_URL}/login")

        # Wait for any potential redirect
        page.wait_for_load_state("networkidle", timeout=15000)

        # Either we stay on SPA (login handled in SPA) or redirect to Keycloak
        current_url = page.url

        # Both scenarios are valid for now
        from config import SPA_HOST

        keycloak_host = (
            "keycloak-e2e:8080" if "spa-e2e:3000" in SPA_URL else "localhost:8180"
        )
        is_on_spa = SPA_HOST in current_url
        is_on_keycloak = keycloak_host in current_url

        assert is_on_spa or is_on_keycloak, f"Unexpected URL: {current_url}"

        if is_on_keycloak:
            # If redirected to Keycloak, verify it's the right realm
            assert "/realms/stuf" in current_url
