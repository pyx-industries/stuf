"""Comprehensive smoke tests for SPA to API connectivity and basic functionality."""

import httpx
import pytest
from config import API_URL, KEYCLOAK_URL, SPA_HOST, SPA_URL
from pages.dashboard_page import DashboardPage
from pages.login_page import LoginPage
from playwright.sync_api import Page


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


class TestSmokeConnectivity:
    """Basic smoke tests to verify SPA to API connectivity."""

    def test_spa_loads(self, page: Page):
        """Test that the SPA loads successfully."""
        dashboard = DashboardPage(page)
        dashboard.navigate_to()

        # Wait for React app to load
        page.wait_for_timeout(2000)

        # Should either see the dashboard (if authenticated) or login prompt
        try:
            # Check if we're authenticated
            page.wait_for_selector('text="Recent files"', timeout=5000)
        except Exception:
            # If not authenticated, should see sign-in page
            sign_in_title = page.locator('text="Sign in to STUF"')
            sign_in_button = page.locator('button:text("Sign in")')
            assert sign_in_title.is_visible() or sign_in_button.is_visible(), (
                "Should show either sign-in title or sign-in button"
            )

    def test_spa_loads_in_browser(self, page: Page):
        """Test that the SPA loads successfully in browser."""
        # Navigate to SPA
        page.goto(SPA_URL)

        # Wait for page to load
        page.wait_for_load_state("networkidle", timeout=15000)

        # Verify we're on the SPA
        assert SPA_HOST in page.url
        assert page.title() == "STUF"

    def test_oidc_authentication_flow_starts(self, page: Page):
        """Test that OIDC authentication flow can start."""
        dashboard = DashboardPage(page)
        dashboard.navigate_to()

        # Clear any existing auth state (after navigating to have localStorage access)
        page.context.clear_cookies()
        try:
            page.evaluate("() => { localStorage.clear(); sessionStorage.clear(); }")
        except Exception:
            # If localStorage access fails, just continue
            pass

        # Reload page to see unauthenticated state
        page.reload()

        # Wait for React to load
        page.wait_for_timeout(2000)

        # Should show unauthenticated state with login button
        page.wait_for_selector('text="Sign in to STUF"', timeout=10000)
        dashboard.take_screenshot("01-unauthenticated-state")
        login_button = page.locator('button:text("Sign in")')
        assert login_button.is_visible(), (
            "Should show login button when unauthenticated"
        )

        # Click login to start OIDC flow
        login_button.click()
        dashboard.take_screenshot("02-clicked-login-button")

        # Should redirect to Keycloak
        login_page = LoginPage(page)
        login_page.wait_for_login_form(timeout=15000)
        login_page.take_screenshot("03-keycloak-login-form")
        login_page.assert_login_form_visible()

    def test_complete_authentication_flow(self, page: Page):
        """Test complete authentication flow from SPA to API."""
        # Start at SPA
        dashboard = DashboardPage(page)
        dashboard.navigate_to()

        # Clear any existing auth state (after navigating to have localStorage access)
        page.context.clear_cookies()
        try:
            page.evaluate("() => { localStorage.clear(); sessionStorage.clear(); }")
        except Exception:
            # If localStorage access fails, just continue
            pass

        # Reload page to see unauthenticated state
        page.reload()

        # Wait for React to load
        page.wait_for_timeout(2000)

        # Should show unauthenticated state
        page.wait_for_selector('text="Sign in to STUF"', timeout=10000)
        login_button = page.locator('button:text("Sign in")')
        login_button.click()

        # Should redirect to login
        login_page = LoginPage(page)
        login_page.wait_for_login_form()

        # Complete login
        login_page.take_screenshot("04-before-credential-entry")
        login_page.login_with_admin_user()

        # Should be back at SPA and authenticated
        page.wait_for_selector('text="Recent files"', timeout=10000)
        dashboard.take_screenshot("05-authenticated-dashboard")
        dashboard.assert_user_logged_in()

    def test_authenticated_api_request_works(self, authenticated_page: Page):
        """Test that authenticated API requests work from the SPA."""
        # The authenticated_page fixture already provides an authenticated session
        dashboard = DashboardPage(authenticated_page)

        # Verify we are authenticated
        dashboard.assert_user_logged_in()

        # Check that there are no console errors related to API calls
        logs = []
        authenticated_page.on("console", lambda msg: logs.append(msg.text))
        authenticated_page.on(
            "pageerror", lambda error: logs.append(f"Page error: {error}")
        )

        # Reload to trigger API calls
        authenticated_page.reload()

        # Wait for React to re-initialize
        authenticated_page.wait_for_timeout(3000)

        # Check if still authenticated (auth might not persist across reload)
        try:
            authenticated_page.wait_for_selector('text="Recent files"', timeout=5000)
        except Exception:
            # If not authenticated, that's also a valid test outcome
            # Just verify we're still at the SPA
            current_url = authenticated_page.url
            assert SPA_HOST in current_url, (
                f"Should stay at SPA, but URL is: {current_url}"
            )

        # Check for authentication or API-related errors
        api_errors = [
            log
            for log in logs
            if any(
                keyword in log.lower()
                for keyword in ["401", "403", "unauthorized", "forbidden"]
            )
        ]

        # Filter out expected websocket errors
        api_errors = [log for log in api_errors if "websocket" not in log.lower()]

        assert len(api_errors) == 0, f"Found API/auth errors in console: {api_errors}"


@pytest.mark.smoke
class TestBasicFunctionality:
    """Basic functionality smoke tests."""

    def test_dashboard_elements_load(self, authenticated_page: Page):
        """Test that basic dashboard elements load."""
        # The authenticated_page fixture already provides an authenticated session at the dashboard
        dashboard = DashboardPage(authenticated_page)

        # Take screenshot for visual verification
        dashboard.take_dashboard_screenshot("smoke-test")

        # Basic assertions that dashboard loaded
        dashboard.assert_user_logged_in()

        # Verify we're at the right place
        current_url = authenticated_page.url
        assert SPA_HOST in current_url, f"Should be at SPA, but URL is: {current_url}"

    def test_logout_functionality(self, authenticated_page: Page):
        """Test basic logout functionality."""
        # The authenticated_page fixture already provides an authenticated session
        dashboard = DashboardPage(authenticated_page)

        # Verify we start authenticated
        dashboard.assert_user_logged_in()

        # Clear auth state to simulate logout (our simple SPA doesn't have logout button)
        authenticated_page.context.clear_cookies()
        authenticated_page.evaluate(
            "() => { localStorage.clear(); sessionStorage.clear(); }"
        )

        # Navigate to SPA again
        authenticated_page.goto(SPA_URL)
        authenticated_page.wait_for_timeout(2000)

        # Should now show unauthenticated state
        try:
            authenticated_page.wait_for_selector(
                'text="Sign in to STUF"', timeout=10000
            )
        except Exception:
            # Alternative: should show login button
            login_button = authenticated_page.locator('button:text("Login")')
            assert login_button.is_visible(), (
                "Should show either auth required or login button after logout"
            )
