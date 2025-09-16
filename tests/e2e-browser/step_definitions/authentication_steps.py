"""Authentication step definitions for BDD tests."""

import pytest
from pytest_bdd import given, when, then, parsers
from playwright.sync_api import Page

from pages.login_page import LoginPage
from pages.dashboard_page import DashboardPage


@given("the STUF services are running")
def stuf_services_running():
    """Ensure STUF services are running - handled by conftest.py fixture."""
    pass


@given("the application is accessible")
def application_accessible():
    """Ensure application is accessible - handled by conftest.py fixture."""
    pass


@given("I navigate to the STUF application")
def navigate_to_application(page: Page):
    """Navigate to the STUF application."""
    dashboard = DashboardPage(page)
    dashboard.navigate_to()
    dashboard.take_screenshot("01-application-loaded")


@given("I am not authenticated")
def not_authenticated(page: Page):
    """Ensure user is not authenticated by clearing storage state."""
    # First navigate to have localStorage access (same pattern as working smoke tests)
    from pages.dashboard_page import DashboardPage
    dashboard = DashboardPage(page)
    dashboard.navigate_to()
    
    # Clear any existing authentication state (after navigating to have localStorage access)
    page.context.clear_cookies()
    try:
        page.evaluate("() => { localStorage.clear(); sessionStorage.clear(); }")
    except:
        # If localStorage access fails, just continue
        pass


@given("I am logged in as an admin user")
def logged_in_as_admin(authenticated_page: Page):
    """Use the authenticated_page fixture which handles login."""
    dashboard = DashboardPage(authenticated_page)
    # Use the same approach as working smoke tests - wait for content, not URL
    authenticated_page.wait_for_selector('text="File Management"', timeout=10000)
    dashboard.assert_user_logged_in()


@given("I am on the dashboard")
def on_dashboard(page: Page):
    """Ensure we are on the dashboard."""
    dashboard = DashboardPage(page)
    dashboard.assert_on_dashboard()


@when("I am redirected to the login page")
def redirected_to_login(page: Page):
    """Trigger and wait for redirect to login page."""
    # First check if we need to click login (not authenticated)
    page.wait_for_timeout(2000)  # Let React load
    
    try:
        # Look for authentication required state
        page.wait_for_selector('text="Authentication Required"', timeout=5000)
        # Click login button to trigger redirect
        login_button = page.locator('button:text("Login")')
        login_button.click()
    except:
        # Might already be redirected or in a different state
        pass
    
    # Now wait for the actual login form
    login_page = LoginPage(page)
    login_page.wait_for_login_form()
    login_page.take_screenshot("02-redirected-to-login")


@when("I enter valid admin credentials")
def enter_valid_admin_credentials(page: Page):
    """Enter valid admin credentials."""
    login_page = LoginPage(page)
    login_page.fill_username("admin@example.com")
    login_page.fill_password("password")
    login_page.take_screenshot("02-credentials-entered")


@when("I enter invalid credentials")
def enter_invalid_credentials(page: Page):
    """Enter invalid credentials."""
    login_page = LoginPage(page)
    login_page.fill_username("invalid@example.com")
    login_page.fill_password("wrongpassword")
    login_page.take_screenshot("02-invalid-credentials-entered")


@when("I click the login button")
def click_login_button(page: Page):
    """Click the SPA login button to start OIDC flow."""
    dashboard = DashboardPage(page)
    
    # Should be at SPA showing authentication required
    page.wait_for_selector('text="Authentication Required"', timeout=10000)
    
    # Click the SPA Login button
    login_button = page.locator('button:text("Login")')
    assert login_button.is_visible(), "SPA Login button should be visible"
    login_button.click()
    
    dashboard.take_screenshot("02-redirected-to-login")


@when("I click the logout button")
def click_logout_button(page: Page):
    """Simulate logout by clearing auth state (SPA doesn't have logout button)."""
    dashboard = DashboardPage(page)
    # Clear auth state to simulate logout (same approach as working smoke tests)
    page.context.clear_cookies()
    page.evaluate("() => { localStorage.clear(); sessionStorage.clear(); }")


@when("I try to access the application directly")
def access_application_directly(page: Page):
    """Try to access the application directly."""
    dashboard = DashboardPage(page)
    dashboard.navigate_to()


@when(parsers.parse('I log in as a "{user_type}" user'))
def login_as_user_type(page: Page, user_type: str):
    """Log in as a specific type of user."""
    # First trigger redirect to login page (same as working login tests)
    page.wait_for_timeout(2000)  # Let React load
    
    try:
        # Look for authentication required state
        page.wait_for_selector('text="Authentication Required"', timeout=5000)
        # Click login button to trigger redirect
        login_button = page.locator('button:text("Login")')
        login_button.click()
    except:
        # Might already be redirected or in a different state
        pass
    
    # Now wait for the actual login form and complete login
    login_page = LoginPage(page)
    login_page.wait_for_login_form()
    
    if user_type.lower() == "regular":
        login_page.fill_username("testuser@example.com")
        login_page.fill_password("password")
        login_page.click_login()
    elif user_type.lower() == "admin":
        login_page.fill_username("admin@example.com")
        login_page.fill_password("password")
        login_page.click_login()
    elif user_type.lower() == "limited":
        login_page.fill_username("limiteduser@example.com")
        login_page.fill_password("password")
        login_page.click_login()
    else:
        raise ValueError(f"Unknown user type: {user_type}")
    
    # Wait for redirect back to SPA
    page.wait_for_timeout(3000)


@then("I should be redirected back to the application")
def redirected_back_to_application(page: Page):
    """Verify redirect back to the application."""
    # Wait for the OIDC callback process to complete
    page.wait_for_timeout(3000)
    
    # Check if we're back at the SPA (should contain localhost:3100)
    current_url = page.url
    if "localhost:3100" not in current_url:
        # If not back yet, wait a bit more for the redirect
        page.wait_for_timeout(5000)
        current_url = page.url
    
    from pages.base_page import BasePage
    base_page = BasePage(page)
    base_page.take_screenshot("05-redirected-back-to-spa")
    
    assert "localhost:3100" in current_url, f"Should be back at SPA, but URL is: {current_url}"


@then("I should see the dashboard")
def see_dashboard(page: Page):
    """Verify the dashboard is visible."""
    dashboard = DashboardPage(page)
    
    # Use the same approach as the working smoke tests
    # Wait for the actual dashboard content, not URL navigation
    page.wait_for_selector('text="File Management"', timeout=10000)
    dashboard.take_screenshot("05-dashboard-loaded")
    dashboard.assert_on_dashboard()


@then("I should be logged in as an authenticated user")
def logged_in_as_authenticated_user(page: Page):
    """Verify user is logged in."""
    dashboard = DashboardPage(page)
    dashboard.take_screenshot("06-authenticated-success")
    dashboard.assert_user_logged_in()


@then("I should see an authentication error message")
def see_authentication_error(page: Page):
    """Verify authentication error message is displayed."""
    login_page = LoginPage(page)
    login_page.take_screenshot("03-authentication-error-displayed")
    login_page.assert_error_message_visible()


@then("I should remain on the login page")
def remain_on_login_page(page: Page):
    """Verify still on login page."""
    login_page = LoginPage(page)
    login_page.assert_on_keycloak_page()
    login_page.assert_login_form_visible()


@then("I should be logged out")
def should_be_logged_out(page: Page):
    """Verify user is logged out."""
    # After logout, accessing the app should redirect to login
    dashboard = DashboardPage(page)
    dashboard.navigate_to()
    
    # Use the same approach as working smoke tests - wait for content, not URL
    # Should now show unauthenticated state
    try:
        page.wait_for_selector('text="Authentication Required"', timeout=10000)
    except:
        # Alternative: should show login button
        login_button = page.locator('button:text("Login")')
        assert login_button.is_visible(), "Should show either auth required or login button after logout"


@then("I should be redirected to the login page")
def redirected_to_login_page(page: Page):
    """Verify redirect to login page."""
    # Use the same approach as working smoke tests - wait for content, not URL
    # Should show unauthenticated state indicating need to login
    try:
        page.wait_for_selector('text="Authentication Required"', timeout=10000)
    except:
        # Alternative: should show login button
        login_button = page.locator('button:text("Login")')
        assert login_button.is_visible(), "Should show either auth required or login button when redirected to login"


@then("I should be redirected to the login page when accessing protected content")
def redirected_to_login_when_accessing_protected(page: Page):
    """Verify redirect to login when accessing protected content."""
    # Use the same approach as working smoke tests - wait for content, not URL
    # Should show unauthenticated state indicating need to login
    try:
        page.wait_for_selector('text="Authentication Required"', timeout=10000)
    except:
        # Alternative: should show login button
        login_button = page.locator('button:text("Login")')
        assert login_button.is_visible(), "Should show either auth required or login button when accessing protected content"


@then("I should still see the dashboard")
def still_see_dashboard(page: Page):
    """Verify dashboard is still visible."""
    dashboard = DashboardPage(page)
    dashboard.assert_on_dashboard()


@then("I should see the login form")
def see_login_form(page: Page):
    """Verify login form is visible."""
    # If we're at the SPA authentication required state, click Login to go to Keycloak
    try:
        login_button = page.locator('button:text("Login")')
        if login_button.is_visible():
            login_button.click()
            # Wait for redirect to Keycloak
            page.wait_for_timeout(2000)
    except:
        pass
    
    # Now verify we're at the Keycloak login form
    login_page = LoginPage(page)
    login_page.wait_for_login_form()
    login_page.assert_login_form_visible()


@then("I should be successfully authenticated")
def successfully_authenticated(page: Page):
    """Verify successful authentication."""
    dashboard = DashboardPage(page)
    # Use the same approach as working smoke tests - wait for content, not URL
    page.wait_for_selector('text="File Management"', timeout=10000)
    dashboard.assert_user_logged_in()


# IDP-agnostic step definitions
@when("I am redirected to the IDP login page")
def redirected_to_idp_login(page: Page):
    """Wait for redirect to IDP login page (same as Keycloak)."""
    # Reuse the same logic as the existing redirect step
    redirected_to_login(page)


@when("I click the IDP login button")  
def click_idp_login_button(page: Page):
    """Click the IDP login button to submit credentials."""
    login_page = LoginPage(page)
    login_page.take_screenshot("03-before-login-click")
    login_page.click_login()
    # Wait a moment for navigation to start
    page.wait_for_timeout(1000)
    login_page.take_screenshot("04-after-login-click")


@then("I should see the dashboard appropriate for my role")
def see_role_appropriate_dashboard(page: Page):
    """Verify dashboard appropriate for user role is shown."""
    dashboard = DashboardPage(page)
    dashboard.assert_on_dashboard()
    # Role-specific assertions could be added here based on the UI


