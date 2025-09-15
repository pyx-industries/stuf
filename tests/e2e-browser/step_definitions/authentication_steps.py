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


@given("I am not authenticated")
def not_authenticated(page: Page):
    """Ensure user is not authenticated by clearing storage state."""
    # Clear any existing authentication state
    page.context.clear_cookies()
    page.evaluate("() => { localStorage.clear(); sessionStorage.clear(); }")


@given("I am logged in as an admin user")
def logged_in_as_admin(authenticated_page: Page):
    """Use the authenticated_page fixture which handles login."""
    dashboard = DashboardPage(authenticated_page)
    dashboard.wait_for_dashboard_load()
    dashboard.assert_user_logged_in()


@given("I am on the dashboard")
def on_dashboard(page: Page):
    """Ensure we are on the dashboard."""
    dashboard = DashboardPage(page)
    dashboard.assert_on_dashboard()


@given("my session is saved")
def session_saved(page: Page):
    """Save the current session state."""
    # Session state is automatically saved by the storage_state configuration
    pass


@when("I am redirected to the login page")
def redirected_to_login(page: Page):
    """Wait for redirect to login page."""
    login_page = LoginPage(page)
    login_page.wait_for_login_form()


@when("I enter valid admin credentials")
def enter_valid_admin_credentials(page: Page):
    """Enter valid admin credentials."""
    login_page = LoginPage(page)
    login_page.fill_username("admin@example.com")
    login_page.fill_password("password")


@when("I enter invalid credentials")
def enter_invalid_credentials(page: Page):
    """Enter invalid credentials."""
    login_page = LoginPage(page)
    login_page.fill_username("invalid@example.com")
    login_page.fill_password("wrongpassword")


@when("I click the login button")
def click_login_button(page: Page):
    """Click the login button."""
    login_page = LoginPage(page)
    login_page.click_login()


@when("I click the logout button")
def click_logout_button(page: Page):
    """Click the logout button."""
    dashboard = DashboardPage(page)
    dashboard.click_logout()


@when("I refresh the page")
def refresh_page(page: Page):
    """Refresh the current page."""
    page.reload()


@when("I try to access the application directly")
def access_application_directly(page: Page):
    """Try to access the application directly."""
    dashboard = DashboardPage(page)
    dashboard.navigate_to()


@when("I start a new browser session")
def new_browser_session(browser_context, page: Page):
    """Start a new browser session (context handles this via storage state)."""
    # The authenticated context should automatically restore the session
    pass


@when(parsers.parse('I log in as a "{user_type}" user'))
def login_as_user_type(page: Page, user_type: str):
    """Log in as a specific type of user."""
    login_page = LoginPage(page)
    
    if user_type.lower() == "regular":
        login_page.login_with_test_user()
    elif user_type.lower() == "admin":
        login_page.login_with_admin_user()
    elif user_type.lower() == "limited":
        login_page.login_with_limited_user()
    else:
        raise ValueError(f"Unknown user type: {user_type}")


@then("I should be redirected back to the application")
def redirected_back_to_application(page: Page):
    """Verify redirect back to the application."""
    login_page = LoginPage(page)
    login_page.wait_for_redirect_to_spa()


@then("I should see the dashboard")
def see_dashboard(page: Page):
    """Verify the dashboard is visible."""
    dashboard = DashboardPage(page)
    dashboard.wait_for_dashboard_load()
    dashboard.assert_on_dashboard()


@then("I should be logged in as an authenticated user")
def logged_in_as_authenticated_user(page: Page):
    """Verify user is logged in."""
    dashboard = DashboardPage(page)
    dashboard.assert_user_logged_in()


@then("I should see an authentication error message")
def see_authentication_error(page: Page):
    """Verify authentication error message is displayed."""
    login_page = LoginPage(page)
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
    
    # Should be redirected to login
    login_page = LoginPage(page)
    login_page.wait_for_login_form(timeout=10000)


@then("I should be redirected to the login page when accessing protected content")
def redirected_to_login_when_accessing_protected(page: Page):
    """Verify redirect to login when accessing protected content."""
    login_page = LoginPage(page)
    login_page.wait_for_login_form()
    login_page.assert_login_form_visible()


@then("I should remain logged in")
def should_remain_logged_in(page: Page):
    """Verify user remains logged in after page refresh."""
    dashboard = DashboardPage(page)
    dashboard.wait_for_dashboard_load()
    dashboard.assert_user_logged_in()


@then("I should still see the dashboard")
def still_see_dashboard(page: Page):
    """Verify dashboard is still visible."""
    dashboard = DashboardPage(page)
    dashboard.assert_on_dashboard()


@then("I should see the login form")
def see_login_form(page: Page):
    """Verify login form is visible."""
    login_page = LoginPage(page)
    login_page.assert_login_form_visible()


@then("I should be successfully authenticated")
def successfully_authenticated(page: Page):
    """Verify successful authentication."""
    dashboard = DashboardPage(page)
    dashboard.wait_for_dashboard_load()
    dashboard.assert_user_logged_in()


@then("I should see the dashboard appropriate for my role")
def see_role_appropriate_dashboard(page: Page):
    """Verify dashboard appropriate for user role is shown."""
    dashboard = DashboardPage(page)
    dashboard.assert_on_dashboard()
    # Role-specific assertions could be added here based on the UI


@then("I should be automatically logged in")
def automatically_logged_in(page: Page):
    """Verify automatic login from saved session."""
    dashboard = DashboardPage(page)
    dashboard.wait_for_dashboard_load()
    dashboard.assert_user_logged_in()


@then("I should see the dashboard without entering credentials")
def see_dashboard_without_credentials(page: Page):
    """Verify dashboard access without credential entry."""
    dashboard = DashboardPage(page)
    dashboard.assert_on_dashboard()
    
    # Verify we didn't go through login form
    current_url = page.url
    assert "localhost:8180" not in current_url, "Should not have gone through login page"