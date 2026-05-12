"""Login Page Object Model for the Zitadel login UI."""

from config import SPA_HOST
from playwright.sync_api import Page

from .base_page import BasePage


class LoginPage(BasePage):
    """Page object for OIDC login interactions with the Zitadel login UI.

    The Zitadel login UI uses a two-step flow: login-name page → Next →
    password page → Sign in.
    """

    def __init__(self, page: Page):
        super().__init__(page)

    # ── Zitadel-login selectors (ghcr.io/zitadel/zitadel-login v4) ────────────
    # Selectors verified against zitadel-login v4.14.0 DOM.
    ZD_LOGINNAME_INPUT = 'input[name="loginName"]'
    ZD_PASSWORD_INPUT = 'input[name="password"]'
    ZD_SUBMIT_BUTTON = 'button[type="submit"]'
    ZD_ERROR_MESSAGE = '[data-testid="error"], .error'

    def wait_for_login_form(self, timeout: int = 30000) -> None:
        """Wait for the login name field to appear."""
        self.page.wait_for_load_state("networkidle", timeout=15000)
        self.page.wait_for_timeout(2000)
        try:
            self.wait_for_selector(self.ZD_LOGINNAME_INPUT, timeout=timeout)
        except Exception as e:
            try:
                self.page.screenshot(path="/app/reports/debug-login.png")
            except Exception:
                pass
            raise RuntimeError(
                f"Login form failed to load. Current URL: {self.page.url}"
            ) from e

    def fill_username(self, username: str) -> None:
        """Fill the login-name field."""
        self.fill_input(self.ZD_LOGINNAME_INPUT, username)

    def fill_password(self, password: str) -> None:
        """Fill the password field."""
        self.fill_input(self.ZD_PASSWORD_INPUT, password)

    def click_login(self) -> None:
        """Click the primary submit button."""
        self.click_element(self.ZD_SUBMIT_BUTTON)

    def login(self, username: str, password: str) -> None:
        """Perform the complete Zitadel two-step login flow."""
        self.wait_for_login_form()
        self.fill_input(self.ZD_LOGINNAME_INPUT, username)
        self.click_element(self.ZD_SUBMIT_BUTTON)
        self.wait_for_selector(self.ZD_PASSWORD_INPUT, timeout=10000)
        self.fill_input(self.ZD_PASSWORD_INPUT, password)
        self.click_element(self.ZD_SUBMIT_BUTTON)

        try:
            self.page.wait_for_url(f"*{SPA_HOST}*", timeout=15000)
        except Exception:
            current_url = self.get_current_url()
            if SPA_HOST not in current_url:
                raise RuntimeError(
                    f"Login failed - not redirected to SPA. Current URL: {current_url}"
                )

        self.page.wait_for_timeout(2000)

    def login_with_admin_user(self) -> None:
        """Login with default admin user credentials."""
        self.login("admin@example.com", "Password1!")

    def login_with_test_user(self) -> None:
        """Login with default test user credentials."""
        self.login("testuser@example.com", "Password1!")

    def login_with_limited_user(self) -> None:
        """Login with limited user credentials."""
        self.login("limiteduser@example.com", "Password1!")

    def assert_login_form_visible(self) -> None:
        """Assert that the login name field is visible."""
        self.assert_element_visible(
            self.ZD_LOGINNAME_INPUT, "Login name input should be visible"
        )

    def assert_error_message_visible(self, expected_message: str = None) -> None:
        """Assert that an error message is displayed."""
        self.assert_element_visible(self.ZD_ERROR_MESSAGE, "Error message should be visible")
        if expected_message:
            self.assert_text_content(self.ZD_ERROR_MESSAGE, expected_message)

    def assert_on_idp_page(self) -> None:
        """Assert that we are on the Zitadel login page."""
        current_url = self.get_current_url()
        assert "/ui/v2/login/" in current_url, (
            f"Should be on Zitadel login page, but URL is: {current_url}"
        )

    def is_login_form_visible(self) -> bool:
        """Check if the login name field is visible."""
        return self.is_visible(self.ZD_LOGINNAME_INPUT)

    def attempt_invalid_login(
        self, username: str = "invalid", password: str = "wrong"
    ) -> None:
        """Attempt login with invalid credentials."""
        self.wait_for_login_form()
        self.fill_input(self.ZD_LOGINNAME_INPUT, username)
        self.click_element(self.ZD_SUBMIT_BUTTON)
        try:
            self.wait_for_selector(self.ZD_PASSWORD_INPUT, timeout=5000)
            self.fill_input(self.ZD_PASSWORD_INPUT, password)
            self.click_element(self.ZD_SUBMIT_BUTTON)
        except Exception:
            pass  # Username step may already have shown the error

    def wait_for_redirect_to_spa(self, timeout: int = 30000) -> None:
        """Wait for redirect back to the SPA after successful login."""
        self.wait_for_url_contains(SPA_HOST, timeout=timeout)
        self.wait_for_network_idle()

    def get_username_input_value(self) -> str:
        """Get the current value of the login-name input."""
        return self.page.input_value(self.ZD_LOGINNAME_INPUT)

    def get_page_title(self) -> str:
        """Get the current page title."""
        return self.page.title()
