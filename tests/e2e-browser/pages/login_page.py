"""Login Page Object Model for Keycloak authentication."""

from playwright.sync_api import Page
from .base_page import BasePage
from config import KEYCLOAK_URL, SPA_HOST


class LoginPage(BasePage):
    """Page object for Keycloak login interactions."""

    def __init__(self, page: Page):
        super().__init__(page)
        self.keycloak_url = KEYCLOAK_URL

    # Selectors
    USERNAME_INPUT = 'input[name="username"]'
    PASSWORD_INPUT = 'input[name="password"]'
    LOGIN_BUTTON = 'button[type="submit"], input[type="submit"]'
    ERROR_MESSAGE = ".alert-error, #input-error, .kc-feedback-text"
    FORGOT_PASSWORD_LINK = 'a[href*="forgot-credentials"]'
    REGISTER_LINK = 'a[href*="registration"]'

    def wait_for_login_form(self, timeout: int = 30000) -> None:
        """Wait for the Keycloak login form to appear."""
        # Wait for redirect to Keycloak
        self.page.wait_for_url(
            f"{self.keycloak_url}/realms/stuf/protocol/openid-connect/auth*",
            timeout=timeout,
        )

        # current_url = self.page.url

        # Wait for page to fully load (CSS/JS)
        self.page.wait_for_load_state("networkidle", timeout=15000)

        # Give extra time for JavaScript to execute and render form
        self.page.wait_for_timeout(3000)

        # Listen for JavaScript console errors
        console_messages = []
        self.page.on(
            "console", lambda msg: console_messages.append(f"{msg.type}: {msg.text}")
        )
        self.page.on(
            "pageerror", lambda error: console_messages.append(f"PAGE ERROR: {error}")
        )

        # Wait for login form elements
        try:
            self.wait_for_selector(self.USERNAME_INPUT, timeout=15000)
        except Exception as e:
            print(f"DEBUG: Username input not found. Current URL: {self.page.url}")

            # Check what input fields are actually present
            all_inputs = self.page.query_selector_all("input")
            print(f"DEBUG: Found {len(all_inputs)} input elements:")
            for i, input_elem in enumerate(all_inputs):
                try:
                    input_type = input_elem.get_attribute("type")
                    input_name = input_elem.get_attribute("name")
                    input_id = input_elem.get_attribute("id")
                    print(
                        f"  Input {i}: type='{input_type}', name='{input_name}', id='{input_id}'"
                    )
                except Exception:
                    print(f"  Input {i}: Could not get attributes")

            # Print console errors if any
            if console_messages:
                print("DEBUG: Console messages during page load:")
                for msg in console_messages:
                    print(f"  {msg}")
            else:
                print("DEBUG: No console messages captured")

            # Get the full page content to see the body
            full_content = self.page.content()
            print(f"DEBUG: Full page content length: {len(full_content)} characters")

            # Look for body content specifically
            if "<body" in full_content:
                body_start = full_content.find("<body")
                body_content = full_content[body_start : body_start + 2000]
                print(f"DEBUG: Body content preview: {body_content}...")
            else:
                print("DEBUG: No body tag found!")
                print(f"DEBUG: Page content preview: {full_content[:1500]}...")

            # Try to take a screenshot for debugging
            try:
                screenshot_path = "/app/reports/debug-keycloak-login.png"
                self.page.screenshot(path=screenshot_path)
                print(f"DEBUG: Screenshot saved to {screenshot_path}")
            except Exception as screenshot_error:
                print(f"DEBUG: Could not take screenshot: {screenshot_error}")

            raise e

        self.wait_for_selector(self.PASSWORD_INPUT, timeout=10000)
        self.wait_for_selector(self.LOGIN_BUTTON, timeout=10000)

    def fill_username(self, username: str) -> None:
        """Fill the username field."""
        self.fill_input(self.USERNAME_INPUT, username)

    def fill_password(self, password: str) -> None:
        """Fill the password field."""
        self.fill_input(self.PASSWORD_INPUT, password)

    def click_login(self) -> None:
        """Click the login button."""
        self.click_element(self.LOGIN_BUTTON)

    def login(self, username: str, password: str) -> None:
        """Perform complete login flow."""
        self.wait_for_login_form()
        self.fill_username(username)
        self.fill_password(password)
        self.click_login()

        # Wait for redirect back to the SPA (more flexible)
        try:
            # Wait for navigation away from Keycloak
            self.page.wait_for_url(f"*{SPA_HOST}*", timeout=15000)
        except Exception:
            # Maybe already redirected - check current URL
            current_url = self.get_current_url()
            if SPA_HOST not in current_url:
                raise RuntimeError(
                    f"Login failed - not redirected to SPA. Current URL: {current_url}"
                )

        # Give time for any additional redirects or processing
        self.page.wait_for_timeout(2000)

    def login_with_admin_user(self) -> None:
        """Login with default admin user credentials."""
        self.login("admin@example.com", "password")

    def login_with_test_user(self) -> None:
        """Login with default test user credentials."""
        self.login("testuser@example.com", "password")

    def login_with_limited_user(self) -> None:
        """Login with limited user credentials."""
        self.login("limiteduser@example.com", "password")

    def assert_login_form_visible(self) -> None:
        """Assert that the login form is visible."""
        self.assert_element_visible(
            self.USERNAME_INPUT, "Username input should be visible"
        )
        self.assert_element_visible(
            self.PASSWORD_INPUT, "Password input should be visible"
        )
        self.assert_element_visible(self.LOGIN_BUTTON, "Login button should be visible")

    def assert_error_message_visible(self, expected_message: str = None) -> None:
        """Assert that an error message is displayed."""
        self.assert_element_visible(
            self.ERROR_MESSAGE, "Error message should be visible"
        )
        if expected_message:
            self.assert_text_content(self.ERROR_MESSAGE, expected_message)

    def assert_on_keycloak_page(self) -> None:
        """Assert that we are on a Keycloak page."""
        current_url = self.get_current_url()
        assert (
            self.keycloak_url in current_url
        ), f"Should be on Keycloak page, but URL is: {current_url}"

    def is_login_form_visible(self) -> bool:
        """Check if the login form is currently visible."""
        return (
            self.is_visible(self.USERNAME_INPUT)
            and self.is_visible(self.PASSWORD_INPUT)
            and self.is_visible(self.LOGIN_BUTTON)
        )

    def clear_username(self) -> None:
        """Clear the username field."""
        self.page.fill(self.USERNAME_INPUT, "")

    def clear_password(self) -> None:
        """Clear the password field."""
        self.page.fill(self.PASSWORD_INPUT, "")

    def click_forgot_password(self) -> None:
        """Click the forgot password link if available."""
        if self.is_visible(self.FORGOT_PASSWORD_LINK):
            self.click_element(self.FORGOT_PASSWORD_LINK)

    def click_register(self) -> None:
        """Click the register link if available."""
        if self.is_visible(self.REGISTER_LINK):
            self.click_element(self.REGISTER_LINK)

    def get_page_title(self) -> str:
        """Get the current page title."""
        return self.page.title()

    def wait_for_redirect_to_spa(self, timeout: int = 30000) -> None:
        """Wait for redirect back to the SPA after successful login."""
        self.wait_for_url_contains(SPA_HOST, timeout=timeout)
        # Wait for the page to load completely
        self.wait_for_network_idle()

    def attempt_invalid_login(
        self, username: str = "invalid", password: str = "wrong"
    ) -> None:
        """Attempt login with invalid credentials."""
        self.wait_for_login_form()
        self.fill_username(username)
        self.fill_password(password)
        self.click_login()
        # Don't wait for redirect since it should fail

    def get_username_input_value(self) -> str:
        """Get the current value of the username input."""
        return self.page.input_value(self.USERNAME_INPUT)

    def get_password_input_value(self) -> str:
        """Get the current value of the password input."""
        return self.page.input_value(self.PASSWORD_INPUT)
