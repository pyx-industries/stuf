"""Login Page Object Model supporting both Keycloak and Zitadel login flows."""

from config import IDP_LOGIN_URL, OIDC_ISSUER_URL, SPA_HOST
from playwright.sync_api import Page

from .base_page import BasePage


class LoginPage(BasePage):
    """Page object for OIDC login interactions.

    Supports two providers:
    - Keycloak: single-step form (username + password on one page).
    - Zitadel: two-step form (login-name page → Next → password page → Sign in).

    Provider detection is automatic based on the current page URL after the OIDC
    redirect:  Keycloak login URLs contain ``/realms/``, Zitadel login URLs contain
    ``/ui/v2/login/``.
    """

    def __init__(self, page: Page):
        super().__init__(page)

    # ── Keycloak selectors ─────────────────────────────────────────────────────
    KC_USERNAME_INPUT = 'input[name="username"]'
    KC_PASSWORD_INPUT = 'input[name="password"]'
    KC_LOGIN_BUTTON = 'button[type="submit"], input[type="submit"]'
    KC_ERROR_MESSAGE = ".alert-error, #input-error, .kc-feedback-text"

    # ── Zitadel-login selectors (ghcr.io/zitadel/zitadel-login v4) ────────────
    # The Zitadel login UI is a Next.js app served at IDP_LOGIN_URL (port 8090
    # by default). It uses a two-step flow: login-name first, then password.
    # Selectors verified against zitadel-login v4.14.0 DOM.
    ZD_LOGINNAME_INPUT = 'input[name="loginName"]'
    ZD_PASSWORD_INPUT = 'input[name="password"]'
    ZD_SUBMIT_BUTTON = 'button[type="submit"]'
    ZD_ERROR_MESSAGE = '[data-testid="error"], .error'

    def _is_zitadel(self) -> bool:
        """Return True when the current URL belongs to the Zitadel login UI."""
        return "/ui/v2/login/" in self.page.url

    def wait_for_login_form(self, timeout: int = 30000) -> None:
        """Wait for the login form to appear, regardless of provider."""
        self.page.wait_for_load_state("networkidle", timeout=15000)
        # Give JavaScript time to render the form
        self.page.wait_for_timeout(2000)

        # Wait for whichever username / login-name input appears (Keycloak or Zitadel)
        combined_selector = f"{self.KC_USERNAME_INPUT}, {self.ZD_LOGINNAME_INPUT}"
        try:
            self.wait_for_selector(combined_selector, timeout=timeout)
        except Exception as e:
            try:
                self.page.screenshot(path="/app/reports/debug-login.png")
            except Exception:
                pass
            raise RuntimeError(
                f"Login form failed to load. Current URL: {self.page.url}"
            ) from e

        if not self._is_zitadel():
            self.wait_for_selector(self.KC_PASSWORD_INPUT, timeout=10000)
            self.wait_for_selector(self.KC_LOGIN_BUTTON, timeout=10000)

    def fill_username(self, username: str) -> None:
        """Fill the username / login-name field."""
        selector = (
            self.ZD_LOGINNAME_INPUT if self._is_zitadel() else self.KC_USERNAME_INPUT
        )
        self.fill_input(selector, username)

    def fill_password(self, password: str) -> None:
        """Fill the password field."""
        selector = self.ZD_PASSWORD_INPUT if self._is_zitadel() else self.KC_PASSWORD_INPUT
        self.fill_input(selector, password)

    def click_login(self) -> None:
        """Click the primary submit button."""
        selector = self.ZD_SUBMIT_BUTTON if self._is_zitadel() else self.KC_LOGIN_BUTTON
        self.click_element(selector)

    def login(self, username: str, password: str) -> None:
        """Perform the complete login flow for whichever provider is active."""
        self.wait_for_login_form()

        if self._is_zitadel():
            # Step 1: enter login name and advance
            self.fill_input(self.ZD_LOGINNAME_INPUT, username)
            self.click_element(self.ZD_SUBMIT_BUTTON)
            # Step 2: wait for password field and submit
            self.wait_for_selector(self.ZD_PASSWORD_INPUT, timeout=10000)
            self.fill_input(self.ZD_PASSWORD_INPUT, password)
            self.click_element(self.ZD_SUBMIT_BUTTON)
        else:
            self.fill_username(username)
            self.fill_password(password)
            self.click_login()

        # Wait for redirect back to the SPA
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
        self.login("admin@example.com", "Password1!" if self._is_zitadel() else "password")

    def login_with_test_user(self) -> None:
        """Login with default test user credentials."""
        self.login("testuser@example.com", "password")

    def login_with_limited_user(self) -> None:
        """Login with limited user credentials."""
        self.login("limiteduser@example.com", "password")

    def assert_login_form_visible(self) -> None:
        """Assert that the login form is visible."""
        if self._is_zitadel():
            self.assert_element_visible(
                self.ZD_LOGINNAME_INPUT, "Login name input should be visible"
            )
        else:
            self.assert_element_visible(
                self.KC_USERNAME_INPUT, "Username input should be visible"
            )
            self.assert_element_visible(
                self.KC_PASSWORD_INPUT, "Password input should be visible"
            )
            self.assert_element_visible(
                self.KC_LOGIN_BUTTON, "Login button should be visible"
            )

    def assert_error_message_visible(self, expected_message: str = None) -> None:
        """Assert that an error message is displayed."""
        selector = self.ZD_ERROR_MESSAGE if self._is_zitadel() else self.KC_ERROR_MESSAGE
        self.assert_element_visible(selector, "Error message should be visible")
        if expected_message:
            self.assert_text_content(selector, expected_message)

    def assert_on_idp_page(self) -> None:
        """Assert that we are on the IDP login page."""
        current_url = self.get_current_url()
        on_page = (
            "/ui/v2/login/" in current_url
            or "/realms/" in current_url
        )
        assert on_page, f"Should be on IDP login page, but URL is: {current_url}"

    def is_login_form_visible(self) -> bool:
        """Check if the login form is currently visible."""
        if self._is_zitadel():
            return self.is_visible(self.ZD_LOGINNAME_INPUT)
        return (
            self.is_visible(self.KC_USERNAME_INPUT)
            and self.is_visible(self.KC_PASSWORD_INPUT)
            and self.is_visible(self.KC_LOGIN_BUTTON)
        )

    def attempt_invalid_login(
        self, username: str = "invalid", password: str = "wrong"
    ) -> None:
        """Attempt login with invalid credentials."""
        self.wait_for_login_form()
        if self._is_zitadel():
            self.fill_input(self.ZD_LOGINNAME_INPUT, username)
            self.click_element(self.ZD_SUBMIT_BUTTON)
            try:
                self.wait_for_selector(self.ZD_PASSWORD_INPUT, timeout=5000)
                self.fill_input(self.ZD_PASSWORD_INPUT, password)
                self.click_element(self.ZD_SUBMIT_BUTTON)
            except Exception:
                pass  # Username step may already have shown the error
        else:
            self.fill_username(username)
            self.fill_password(password)
            self.click_login()

    def wait_for_redirect_to_spa(self, timeout: int = 30000) -> None:
        """Wait for redirect back to the SPA after successful login."""
        self.wait_for_url_contains(SPA_HOST, timeout=timeout)
        self.wait_for_network_idle()

    def get_username_input_value(self) -> str:
        """Get the current value of the username / login-name input."""
        selector = (
            self.ZD_LOGINNAME_INPUT if self._is_zitadel() else self.KC_USERNAME_INPUT
        )
        return self.page.input_value(selector)

    def get_page_title(self) -> str:
        """Get the current page title."""
        return self.page.title()
