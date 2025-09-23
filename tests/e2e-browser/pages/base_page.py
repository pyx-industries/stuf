"""Base Page Object Model for STUF Browser E2E Tests."""

from playwright.sync_api import Page, expect
from typing import Optional
from config import SPA_URL


class BasePage:
    """Base page object with common functionality for all pages."""

    def __init__(self, page: Page):
        """Initialize base page with Playwright page object."""
        self.page = page
        self.base_url = SPA_URL

    def navigate_to(self, path: str = "") -> None:
        url = f"{self.base_url}{path}"
        self.page.goto(url)

    def wait_for_page_load(self, timeout: int = 30000) -> None:
        self.page.wait_for_load_state("networkidle", timeout=timeout)

    def wait_for_selector(self, selector: str, timeout: int = 10000) -> None:
        """Wait for an element to appear on the page."""
        self.page.wait_for_selector(selector, timeout=timeout)

    def click_element(self, selector: str) -> None:
        self.page.click(selector)

    def fill_input(self, selector: str, value: str) -> None:
        self.page.fill(selector, value)

    def get_text(self, selector: str) -> str:
        return self.page.text_content(selector) or ""

    def is_visible(self, selector: str) -> bool:
        """Check if an element is visible on the page."""
        try:
            return self.page.is_visible(selector)
        except Exception:
            return False

    def take_screenshot(
        self,
        name: str,
        scenario_name: str = "",
        step_index: int = 0,
        step_text: str = "",
        test_type: str = "bdd",
    ) -> str:
        """Take a screenshot and return the file path.

        Args:
            name: Step-specific name for the screenshot
            scenario_name: Optional scenario name for directory organization
            step_index: Step number (1-based) for proper ordering
            step_text: BDD step text for descriptive filenames
            test_type: Type of test ("bdd" or "direct") to separate screenshot directories
        """
        from pathlib import Path

        base_screenshots_dir = Path(__file__).parent.parent / "reports" / "screenshots"

        if scenario_name and step_index > 0:
            # Hierarchical storage: bdd/scenario/step-NN-description.png OR direct/test-name/step-NN-description.png
            type_dir = base_screenshots_dir / test_type
            clean_scenario = self._clean_name_for_path(scenario_name)
            scenario_dir = type_dir / clean_scenario
            scenario_dir.mkdir(parents=True, exist_ok=True)

            # Create descriptive filename from step text or fallback to name
            if step_text:
                clean_step = self._clean_name_for_path(step_text)
                filename = f"step-{step_index:02d}-{clean_step}.png"
            else:
                clean_name = self._clean_name_for_path(name)
                filename = f"step-{step_index:02d}-{clean_name}.png"

            screenshot_path = scenario_dir / filename
        else:
            # Legacy fallback for old-style calls - should be eliminated
            fallback_dir = base_screenshots_dir / "_legacy" / test_type
            fallback_dir.mkdir(parents=True, exist_ok=True)

            clean_name = self._clean_name_for_path(name)
            filename = f"{clean_name}.png"
            screenshot_path = fallback_dir / filename

        # Take full page screenshot instead of just viewport
        self.page.screenshot(path=str(screenshot_path), full_page=True)
        return str(screenshot_path)

    def _clean_name_for_path(self, name: str) -> str:
        """Clean a name for use in file paths - no spaces, safe characters only."""
        import re

        # Convert to lowercase, replace spaces with hyphens
        clean = name.lower().replace(" ", "-").replace("_", "-")
        # Remove non-alphanumeric characters except hyphens
        clean = re.sub(r"[^a-z0-9-]", "", clean)
        # Remove multiple consecutive hyphens
        clean = re.sub(r"-+", "-", clean)
        # Remove leading/trailing hyphens
        return clean.strip("-")

    def wait_for_url_contains(self, text: str, timeout: int = 30000) -> None:
        """Wait for URL to contain specific text."""
        self.page.wait_for_url(f"*{text}*", timeout=timeout)

    def get_current_url(self) -> str:
        """Get the current page URL."""
        return self.page.url

    def scroll_to_element(self, selector: str) -> None:
        """Scroll to bring an element into view."""
        self.page.locator(selector).scroll_into_view_if_needed()

    def wait_for_element_count(
        self, selector: str, count: int, timeout: int = 10000
    ) -> None:
        """Wait for a specific number of elements matching the selector."""
        expect(self.page.locator(selector)).to_have_count(count, timeout=timeout)

    def assert_element_visible(
        self, selector: str, error_message: Optional[str] = None
    ) -> None:
        """Assert that an element is visible."""
        expect(self.page.locator(selector)).to_be_visible()

    def assert_element_not_visible(
        self, selector: str, error_message: Optional[str] = None
    ) -> None:
        """Assert that an element is not visible."""
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
