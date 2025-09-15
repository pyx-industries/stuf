"""Base Page Object Model for STUF Browser E2E Tests."""

from playwright.sync_api import Page, expect
from typing import Optional


class BasePage:
    """Base page object with common functionality for all pages."""
    
    def __init__(self, page: Page):
        """Initialize base page with Playwright page object."""
        self.page = page
        self.base_url = "http://localhost:3100"
    
    def navigate_to(self, path: str = "") -> None:
        """Navigate to a specific path within the application."""
        url = f"{self.base_url}{path}"
        self.page.goto(url)
    
    def wait_for_page_load(self, timeout: int = 30000) -> None:
        """Wait for page to fully load."""
        self.page.wait_for_load_state("networkidle", timeout=timeout)
    
    def wait_for_selector(self, selector: str, timeout: int = 10000) -> None:
        """Wait for an element to appear on the page."""
        self.page.wait_for_selector(selector, timeout=timeout)
    
    def click_element(self, selector: str) -> None:
        """Click an element by selector."""
        self.page.click(selector)
    
    def fill_input(self, selector: str, value: str) -> None:
        """Fill an input field with a value."""
        self.page.fill(selector, value)
    
    def get_text(self, selector: str) -> str:
        """Get text content of an element."""
        return self.page.text_content(selector) or ""
    
    def is_visible(self, selector: str) -> bool:
        """Check if an element is visible on the page."""
        try:
            return self.page.is_visible(selector)
        except:
            return False
    
    def take_screenshot(self, name: str) -> str:
        """Take a screenshot and return the file path."""
        from pathlib import Path
        screenshot_dir = Path(__file__).parent.parent / "reports" / "screenshots"
        screenshot_dir.mkdir(parents=True, exist_ok=True)
        
        screenshot_path = screenshot_dir / f"{name}.png"
        self.page.screenshot(path=str(screenshot_path))
        return str(screenshot_path)
    
    def wait_for_url_contains(self, text: str, timeout: int = 30000) -> None:
        """Wait for URL to contain specific text."""
        self.page.wait_for_url(f"*{text}*", timeout=timeout)
    
    def get_current_url(self) -> str:
        """Get the current page URL."""
        return self.page.url
    
    def scroll_to_element(self, selector: str) -> None:
        """Scroll to bring an element into view."""
        self.page.locator(selector).scroll_into_view_if_needed()
    
    def wait_for_element_count(self, selector: str, count: int, timeout: int = 10000) -> None:
        """Wait for a specific number of elements matching the selector."""
        expect(self.page.locator(selector)).to_have_count(count, timeout=timeout)
    
    def assert_element_visible(self, selector: str, error_message: Optional[str] = None) -> None:
        """Assert that an element is visible."""
        message = error_message or f"Element {selector} should be visible"
        expect(self.page.locator(selector)).to_be_visible()
    
    def assert_element_not_visible(self, selector: str, error_message: Optional[str] = None) -> None:
        """Assert that an element is not visible."""
        message = error_message or f"Element {selector} should not be visible"
        expect(self.page.locator(selector)).not_to_be_visible()
    
    def assert_text_content(self, selector: str, expected_text: str) -> None:
        """Assert that an element contains specific text."""
        expect(self.page.locator(selector)).to_contain_text(expected_text)
    
    def assert_page_title(self, expected_title: str) -> None:
        """Assert the page title."""
        expect(self.page).to_have_title(expected_title)
    
    def wait_for_network_idle(self, timeout: int = 30000) -> None:
        """Wait for network activity to settle."""
        self.page.wait_for_load_state("networkidle", timeout=timeout)
    
    def reload_page(self) -> None:
        """Reload the current page."""
        self.page.reload()
    
    def go_back(self) -> None:
        """Navigate back in browser history."""
        self.page.go_back()
    
    def go_forward(self) -> None:
        """Navigate forward in browser history."""
        self.page.go_forward()