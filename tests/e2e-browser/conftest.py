"""Shared pytest fixtures for browser E2E tests."""

import os
from pathlib import Path

import pytest
from playwright.sync_api import sync_playwright

# Use centralized configuration
try:
    from config import SPA_URL as BASE_URL, API_URL, KEYCLOAK_URL, SPA_HOST
except Exception:
    # Fallback values
    BASE_URL = "http://spa-e2e:3000"
    API_URL = "http://api-e2e:8000"
    KEYCLOAK_URL = "http://keycloak-e2e:8080"
    SPA_HOST = "spa-e2e:3000"

STORAGE_STATE_FILE = Path(__file__).parent / "auth-storage-state.json"


@pytest.fixture(scope="session")
def playwright():
    """Session-scoped Playwright fixture."""
    with sync_playwright() as p:
        yield p


@pytest.fixture(scope="session")
def browser(playwright):
    """Session-scoped browser fixture."""
    browser = playwright.chromium.launch(
        headless=os.getenv("PLAYWRIGHT_HEADLESS", "true").lower() == "true",
        slow_mo=int(os.getenv("PLAYWRIGHT_SLOW_MO", "0")),
    )
    yield browser
    browser.close()


@pytest.fixture(scope="session")
def browser_context_args():
    """Arguments for browser context creation."""
    from pathlib import Path

    # Ensure video directory exists
    videos_dir = Path(__file__).parent / "reports" / "videos" / "bdd"
    videos_dir.mkdir(parents=True, exist_ok=True)

    args = {
        "viewport": {"width": 1280, "height": 720},
        "ignore_https_errors": True,
        "permissions": ["clipboard-read", "clipboard-write"],
        "record_video_dir": str(videos_dir),
        "record_video_size": {"width": 1280, "height": 720},
    }

    # Note: No longer using storage state since authenticated_page does live auth
    # This makes tests more reliable but slightly slower

    return args


@pytest.fixture(scope="function")
def context(browser, browser_context_args):
    """Function-scoped browser context with authentication."""
    context = browser.new_context(**browser_context_args)
    yield context
    context.close()


@pytest.fixture(scope="function")
def page(context):
    """Function-scoped page fixture."""
    page = context.new_page()

    # Set default navigation timeout
    page.set_default_navigation_timeout(30000)
    page.set_default_timeout(10000)

    yield page


@pytest.fixture(scope="function")
def authenticated_page(page):
    """Page fixture that ensures user is authenticated via live login."""
    # Navigate to the SPA
    page.goto(BASE_URL)

    # Wait for React app to load
    page.wait_for_timeout(2000)

    # Check if we're already authenticated
    try:
        # Look for signs of successful authentication
        page.wait_for_selector('text="File Management"', timeout=3000)
        # Also check we don't see the "Authentication Required" message
        auth_required = page.locator('text="Authentication Required"')
        if not auth_required.is_visible():
            # Already authenticated
            yield page
            return
    except Exception:
        # Not authenticated, need to perform login
        pass

    # Trigger login by clicking the login button
    try:
        login_button = page.locator('button:text("Login")')
        if login_button.is_visible():
            login_button.click()

            # Wait for redirect to Keycloak
            page.wait_for_url(
                f"{KEYCLOAK_URL}/realms/stuf/protocol/openid-connect/auth*",
                timeout=10000,
            )
        else:
            raise RuntimeError("Login button not found")
    except Exception as e:
        raise RuntimeError(f"Failed to start login flow: {e}")

    # Fill in login form
    try:
        # Wait for login form
        page.wait_for_selector('input[name="username"]', timeout=10000)
        page.wait_for_selector('input[name="password"]', timeout=5000)

        # Fill credentials
        page.fill('input[name="username"]', "admin@example.com")
        page.fill('input[name="password"]', "password")

        # Submit
        page.click('button[type="submit"]')

        # Wait for redirect back to SPA (more flexible)
        max_attempts = 15
        for attempt in range(max_attempts):
            page.wait_for_timeout(1000)
            current_url = page.url
            if SPA_HOST in current_url:
                break
        else:
            raise RuntimeError(
                f"Not redirected to SPA after login. Current URL: {page.url}"
            )

        # Give time for React to process the auth callback
        page.wait_for_timeout(3000)

    except Exception as e:
        raise RuntimeError(f"Login flow failed: {e}")

    # Wait for authentication to complete
    try:
        # Wait for authenticated content to appear
        page.wait_for_selector('text="File Management"', timeout=10000)

        # Verify we don't see authentication required
        auth_required = page.locator('text="Authentication Required"')
        if auth_required.is_visible():
            raise RuntimeError(
                "Authentication failed - still seeing auth required message"
            )

    except Exception as e:
        raise RuntimeError(f"Authentication verification failed: {e}")

    yield page


@pytest.fixture(scope="session", autouse=True)
def ensure_services_ready():
    """Ensure all services are ready before running tests."""
    import time
    import httpx

    services = [
        (f"{API_URL}/api/health", "API"),
        (f"{BASE_URL}", "SPA"),
        (f"{KEYCLOAK_URL}", "Keycloak"),
    ]

    print("Checking service health...")

    for url, name in services:
        max_retries = 30
        retry_delay = 2

        for attempt in range(max_retries):
            try:
                with httpx.Client(timeout=5.0) as client:
                    response = client.get(url)
                    if response.status_code < 400:
                        print(f"{name} is ready")
                        break
            except Exception as e:
                if attempt < max_retries - 1:
                    print(
                        f"{name} not ready yet, retrying in {retry_delay}s... ({attempt + 1}/{max_retries})"
                    )
                    time.sleep(retry_delay)
                else:
                    raise RuntimeError(
                        f"{name} failed to become ready after {max_retries} attempts: {e}"
                    )
        else:
            raise RuntimeError(f"{name} never became ready")

    print("All services are ready!")


# BDD step fixtures for pytest-bdd
@pytest.fixture
def browser_context(context):
    """Alias for context to match BDD naming conventions."""
    return context


@pytest.fixture
def browser_page(page):
    """Alias for page to match BDD naming conventions."""
    return page


@pytest.fixture
def app_urls():
    """Fixture providing application URLs for tests."""
    return {
        "spa": BASE_URL,
        "api": API_URL,
        "keycloak": KEYCLOAK_URL,
    }


@pytest.fixture
def test_data():
    """Fixture providing test data for various scenarios."""
    return {
        "users": {
            "admin": {
                "username": "admin@example.com",
                "password": "password",
                "role": "admin",
            },
            "user": {
                "username": "testuser@example.com",
                "password": "password",
                "role": "user",
            },
            "limited": {
                "username": "limiteduser@example.com",
                "password": "password",
                "role": "limited",
            },
        },
        "collections": {
            "public": "public-collection",
            "private": "private-collection",
            "restricted": "admin-only-collection",
        },
        "files": {
            "small_text": {
                "name": "test-file.txt",
                "content": "This is a test file for E2E testing.",
                "type": "text/plain",
            },
            "small_image": {
                "name": "test-image.png",
                "content": b"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
                "type": "image/png",
            },
        },
    }


# Configure pytest-bdd
def pytest_bdd_step_error(
    request, feature, scenario, step, step_func, step_func_args, exception
):
    """Handle BDD step errors with enhanced debugging."""
    print("\nBDD Step failed:")
    print(f"   Feature: {feature.name}")
    print(f"   Scenario: {scenario.name}")
    print(f"   Step: {step.name}")
    print(f"   Exception: {exception}")

    # Take screenshot on step failure if page is available
    if "page" in step_func_args:
        page = step_func_args["page"]
        try:
            screenshot_path = (
                Path(__file__).parent
                / "reports"
                / "screenshots"
                / f"step-failure-{scenario.name.replace(' ', '-')}.png"
            )
            screenshot_path.parent.mkdir(parents=True, exist_ok=True)
            page.screenshot(path=str(screenshot_path))
            print(f"   Screenshot: {screenshot_path}")
        except Exception:
            pass


# Configure pytest markers
def pytest_configure(config):
    """Configure pytest markers for E2E tests."""
    config.addinivalue_line("markers", "smoke: Quick smoke tests")
    config.addinivalue_line("markers", "e2e: End-to-end tests")
    config.addinivalue_line("markers", "integration: Integration tests")
    config.addinivalue_line("markers", "unit: Unit tests")


@pytest.fixture
def bdd_screenshot_helper(page, request):
    """Provide BDD screenshot helper with scenario context."""
    from helpers.bdd_screenshot import BDDScreenshotHelper

    helper = BDDScreenshotHelper(page, request)

    def _save_video():
        # First prepare the video paths
        helper.save_scenario_video()
        # Then finalize the video file
        helper.finalize_video()

    request.addfinalizer(_save_video)

    return helper
