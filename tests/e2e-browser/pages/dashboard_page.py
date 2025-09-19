"""Dashboard Page Object Model for STUF application main interface."""

from playwright.sync_api import Page
from .base_page import BasePage
from typing import List
from config import SPA_HOST


class DashboardPage(BasePage):
    """Page object for the main STUF application dashboard."""

    def __init__(self, page: Page):
        super().__init__(page)

    # Common UI selectors - these may need adjustment based on actual SPA implementation
    USER_MENU = '[data-testid="user-menu"], .user-info, [aria-label*="user"], [aria-label*="User"]'
    LOGOUT_BUTTON = (
        '[data-testid="logout"], button:has-text("Logout"), button:has-text("Sign out")'
    )
    UPLOAD_BUTTON = (
        '[data-testid="upload"], button:has-text("Upload"), input[type="file"]'
    )
    FILE_LIST = '[data-testid="file-list"], .file-list, .files'
    FILE_ITEM = '.file-item, [data-testid="file-item"], tr[data-file]'
    COLLECTION_SELECTOR = '[data-testid="collection-select"], select[name="collection"]'
    NAVIGATION_MENU = '[data-testid="nav-menu"], .navigation, nav'
    LOADING_INDICATOR = '.loading, .spinner, [data-testid="loading"]'
    ERROR_MESSAGE = '.error, .alert-error, [data-testid="error"]'
    SUCCESS_MESSAGE = '.success, .alert-success, [data-testid="success"]'

    def wait_for_dashboard_load(self, timeout: int = 10000) -> None:
        """Wait for the dashboard to fully load after authentication."""
        # Wait for the URL to indicate we're in the app (not on auth pages)
        self.wait_for_url_contains(SPA_HOST)

        # Wait for React app to initialize and process auth state
        self.page.wait_for_timeout(1000)  # Allow React auth context to initialize

        # Wait for network idle to ensure all auth processing is complete
        self.wait_for_network_idle(timeout=timeout)

    def assert_user_logged_in(self) -> None:
        """Assert that a user is logged in (authentication successful)."""
        # Wait for authenticated state to be stable
        self.page.wait_for_timeout(1000)

        # First check for authentication errors - take screenshot for debugging
        self.take_screenshot("debug-before-auth-check")
        page_content = self.page.content()
        print(
            f"DEBUG: Page contains 'Authentication error': {'Authentication error' in page_content}"
        )
        print(f"DEBUG: Page title: {self.page.title()}")

        auth_error = self.page.get_by_text("Authentication error", exact=False)
        print(f"DEBUG: Checking for auth error, found: {auth_error.count()}")
        if auth_error.is_visible():
            self.take_screenshot("auth-error-detected")
            error_text = auth_error.text_content()
            print(f"DEBUG: Auth error detected: {error_text}")
            raise AssertionError(f"Authentication failed: {error_text}")
        else:
            print("DEBUG: No auth error visible")

        # Check for other error indicators
        try_again_button = self.page.locator('button:text("Try Again")')
        if try_again_button.is_visible():
            self.take_screenshot("auth-retry-button-detected")
            raise AssertionError(
                "Authentication failed - 'Try Again' button is visible"
            )

        # Positive check: we should see authenticated content (like "File Management")
        try:
            self.page.wait_for_selector('text="File Management"', timeout=5000)
        except Exception:
            # If we don't see the expected authenticated content, capture current state
            self.take_screenshot("auth-verification-failed")
            raise AssertionError(
                "User is not logged in - cannot find 'File Management' content"
            )

        # Negative checks: we should not see authentication required states
        auth_required = self.page.locator('text="Authentication Required"')
        assert (
            not auth_required.is_visible()
        ), "User is not logged in - still seeing authentication required message"

        login_button = self.page.locator('button:text("Login")')
        assert (
            not login_button.is_visible()
        ), "User is not logged in - still seeing login button"

    def get_current_user_info(self) -> str:
        """Get current user information if displayed."""
        if self.is_visible(self.USER_MENU):
            return self.get_text(self.USER_MENU)
        return "User info not available"

    def click_logout(self) -> None:
        """Click the logout button."""
        # First try to find and click user menu to reveal logout
        if self.is_visible(self.USER_MENU):
            self.click_element(self.USER_MENU)

        # Then click logout
        self.wait_for_selector(self.LOGOUT_BUTTON, timeout=5000)
        self.click_element(self.LOGOUT_BUTTON)

    def navigate_to_upload(self) -> None:
        """Navigate to or focus on upload functionality."""
        if self.is_visible(self.UPLOAD_BUTTON):
            self.scroll_to_element(self.UPLOAD_BUTTON)

    def get_file_list_items(self) -> List[str]:
        """Get list of files displayed in the file list."""
        if not self.is_visible(self.FILE_LIST):
            return []

        # Wait for file items to load
        self.page.wait_for_timeout(1000)

        file_elements = self.page.locator(self.FILE_ITEM)
        return [
            file_elements.nth(i).text_content() or ""
            for i in range(file_elements.count())
        ]

    def select_collection(self, collection_name: str) -> None:
        """Select a specific collection if collection selector is available."""
        if self.is_visible(self.COLLECTION_SELECTOR):
            self.page.select_option(self.COLLECTION_SELECTOR, collection_name)

    def wait_for_file_upload_complete(self, timeout: int = 30000) -> None:
        """Wait for file upload to complete (no loading indicators)."""
        # Wait for loading indicators to disappear
        if self.is_visible(self.LOADING_INDICATOR):
            self.page.wait_for_selector(
                self.LOADING_INDICATOR, state="hidden", timeout=timeout
            )

        # Wait for network activity to settle
        self.wait_for_network_idle()

    def assert_success_message(self, expected_message: str = None) -> None:
        """Assert that a success message is displayed."""
        self.assert_element_visible(
            self.SUCCESS_MESSAGE, "Success message should be visible"
        )
        if expected_message:
            self.assert_text_content(self.SUCCESS_MESSAGE, expected_message)

    def assert_error_message(self, expected_message: str = None) -> None:
        """Assert that an error message is displayed."""
        self.assert_element_visible(
            self.ERROR_MESSAGE, "Error message should be visible"
        )
        if expected_message:
            self.assert_text_content(self.ERROR_MESSAGE, expected_message)

    def is_loading(self) -> bool:
        """Check if the page is currently loading."""
        return self.is_visible(self.LOADING_INDICATOR)

    def wait_for_no_loading(self, timeout: int = 30000) -> None:
        """Wait for all loading indicators to disappear."""
        if self.is_visible(self.LOADING_INDICATOR):
            self.page.wait_for_selector(
                self.LOADING_INDICATOR, state="hidden", timeout=timeout
            )

    def refresh_file_list(self) -> None:
        """Refresh the file list by reloading the page."""
        self.reload_page()
        self.wait_for_dashboard_load()

    def search_files(self, search_term: str) -> None:
        """Search for files if search functionality exists."""
        search_selector = (
            'input[type="search"], input[placeholder*="search"], [data-testid="search"]'
        )
        if self.is_visible(search_selector):
            self.fill_input(search_selector, search_term)
            # Trigger search (might be automatic or require pressing Enter)
            self.page.keyboard.press("Enter")

    def get_page_heading(self) -> str:
        """Get the main page heading or title."""
        headings = ["h1", "h2", ".page-title", "[data-testid='page-title']"]
        for heading in headings:
            if self.is_visible(heading):
                return self.get_text(heading)
        return ""

    def assert_on_dashboard(self) -> None:
        """Assert that we are on the main dashboard page."""
        current_url = self.get_current_url()
        assert (
            SPA_HOST in current_url
        ), f"Should be on dashboard, but URL is: {current_url}"

        # Also check for dashboard-specific elements
        self.assert_user_logged_in()

    def take_dashboard_screenshot(self, name: str = "dashboard") -> str:
        """Take a screenshot of the dashboard."""
        return self.take_screenshot(f"{name}-dashboard")

    def get_available_collections(self) -> List[str]:
        """Get list of available collections if collection selector exists."""
        if not self.is_visible(self.COLLECTION_SELECTOR):
            return []

        options = self.page.locator(f"{self.COLLECTION_SELECTOR} option")
        return [options.nth(i).text_content() or "" for i in range(options.count())]
