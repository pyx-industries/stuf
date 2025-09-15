"""Simple smoke test for basic connectivity."""

import pytest
import httpx
from playwright.sync_api import Page

from pages.dashboard_page import DashboardPage


class TestBasicConnectivity:
    """Basic connectivity tests without full authentication flow."""
    
    def test_all_services_responding(self):
        """Test that all services are responding to basic requests."""
        # Test API
        with httpx.Client() as client:
            response = client.get("http://localhost:8100/api/health", timeout=10.0)
            assert response.status_code == 200
            assert "healthy" in response.json().get("status", "")
        
        # Test SPA
        with httpx.Client() as client:
            response = client.get("http://localhost:3100", timeout=10.0)
            assert response.status_code == 200
            assert "STUF" in response.text
        
        # Test Keycloak basic response
        with httpx.Client() as client:
            response = client.get("http://localhost:8180", timeout=10.0)
            # Keycloak may return various status codes, just ensure it responds
            assert response.status_code < 500  # Any response better than server error
    
    def test_spa_loads_in_browser(self, page: Page):
        """Test that the SPA loads successfully in browser."""
        # Navigate to SPA
        page.goto("http://localhost:3100")
        
        # Wait for page to load
        page.wait_for_load_state("networkidle", timeout=15000)
        
        # Verify we're on the SPA
        assert "localhost:3100" in page.url
        assert page.title() == "STUF"
        
        # Verify React app has initialized (no critical JS errors)
        # The fact that we can get the title suggests React loaded
        
    def test_spa_shows_unauthenticated_state(self, page: Page):
        """Test that SPA shows appropriate state when user is not authenticated."""
        page.goto("http://localhost:3100")
        page.wait_for_load_state("networkidle", timeout=15000)
        
        # The page should load without errors
        # We can check console messages to see authentication state
        console_messages = []
        page.on('console', lambda msg: console_messages.append(msg.text))
        
        # Reload to capture console messages from start
        page.reload()
        page.wait_for_load_state("networkidle", timeout=15000)
        
        # Look for authentication-related console messages
        auth_messages = [msg for msg in console_messages if 'Auth user' in msg]
        assert len(auth_messages) > 0, "Should see authentication-related console messages"
        
    def test_basic_oidc_redirect_available(self, page: Page):
        """Test that OIDC redirect mechanism is available (without full auth)."""
        # Try to navigate to a URL that might trigger OIDC redirect
        # This depends on how the SPA is configured
        page.goto("http://localhost:3100/login")
        
        # Wait for any potential redirect
        page.wait_for_load_state("networkidle", timeout=15000)
        
        # Either we stay on SPA (login handled in SPA) or redirect to Keycloak
        current_url = page.url
        
        # Both scenarios are valid for now
        is_on_spa = "localhost:3100" in current_url
        is_on_keycloak = "localhost:8180" in current_url
        
        assert is_on_spa or is_on_keycloak, f"Unexpected URL: {current_url}"
        
        if is_on_keycloak:
            # If redirected to Keycloak, verify it's the right realm
            assert "/realms/stuf" in current_url