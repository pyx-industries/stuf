"""Playwright configuration for STUF browser E2E tests."""

import os
from pathlib import Path

# Test environment URLs - these match the E2E Docker Compose setup
BASE_URL = os.getenv("SPA_URL", "http://localhost:3100")  # React SPA (E2E port)
API_URL = os.getenv("API_URL", "http://localhost:8100")  # FastAPI (E2E port)
KEYCLOAK_URL = os.getenv("KEYCLOAK_URL", "http://localhost:8180")  # Keycloak (E2E port)

# Test directories
TESTS_DIR = Path(__file__).parent
REPORTS_DIR = TESTS_DIR / "reports"
SCREENSHOTS_DIR = REPORTS_DIR / "screenshots"
VIDEOS_DIR = REPORTS_DIR / "videos"
TRACES_DIR = REPORTS_DIR / "traces"

# Ensure report directories exist
REPORTS_DIR.mkdir(exist_ok=True)
SCREENSHOTS_DIR.mkdir(exist_ok=True)
VIDEOS_DIR.mkdir(exist_ok=True)
TRACES_DIR.mkdir(exist_ok=True)

# Playwright configuration
PLAYWRIGHT_CONFIG = {
    "base_url": BASE_URL,
    "timeout": 30_000,  # 30 seconds
    "expect_timeout": 10_000,  # 10 seconds
    "navigation_timeout": 30_000,  # 30 seconds
    # Global test configuration
    "test_dir": str(TESTS_DIR / "features"),
    "reporter": [
        ("html", {"output_folder": str(REPORTS_DIR / "playwright-report")}),
        ("allure-playwright", {"output_folder": str(REPORTS_DIR / "allure-results")}),
    ],
    # Browser projects
    "projects": [
        {
            "name": "chromium",
            "use": {
                "browser_name": "chromium",
                "headless": True,  # Can be overridden with --headed flag
                "viewport": {"width": 1280, "height": 720},
                "screenshot": "on",  # Always capture screenshots for presentation
                "video": "on",  # Always record videos for stakeholder presentations
                "trace": "retain-on-failure",
                # Artifact paths
                "screenshot_dir": str(SCREENSHOTS_DIR),
                "video_dir": str(VIDEOS_DIR),
                "trace_dir": str(TRACES_DIR),
                # Browser context options
                "ignore_https_errors": True,  # For local development
                "permissions": ["clipboard-read", "clipboard-write"],
                # Storage state for authenticated sessions
                "storage_state": str(TESTS_DIR / "auth-storage-state.json"),
            },
        },
        {
            "name": "firefox",
            "use": {
                "browser_name": "firefox",
                "headless": True,
                "viewport": {"width": 1280, "height": 720},
                "screenshot": "on",  # Always capture screenshots for presentation
                "video": "on",  # Always record videos for stakeholder presentations
                "trace": "retain-on-failure",
                # Artifact paths
                "screenshot_dir": str(SCREENSHOTS_DIR),
                "video_dir": str(VIDEOS_DIR),
                "trace_dir": str(TRACES_DIR),
                # Browser context options
                "ignore_https_errors": True,
                "permissions": ["clipboard-read", "clipboard-write"],
                # Storage state for authenticated sessions
                "storage_state": str(TESTS_DIR / "auth-storage-state.json"),
            },
        },
    ],
    # Global setup disabled - tests use live auth via authenticated_page fixture
    # "global_setup": str(TESTS_DIR / "global-setup.py"),
    # Retry configuration
    "retries": 1,  # Retry once on failure
    "workers": 1,  # Run tests in series for now (can be increased later)
    # Test match patterns
    "test_match": ["features/**/*.feature", "test_*.py"],
}


def get_config():
    """Get Playwright configuration with environment overrides."""
    config = PLAYWRIGHT_CONFIG.copy()

    # Override headless mode if requested
    if os.getenv("PLAYWRIGHT_HEADLESS", "true").lower() == "false":
        for project in config["projects"]:
            project["use"]["headless"] = False

    # Override worker count for parallel execution
    workers = os.getenv("PLAYWRIGHT_WORKERS")
    if workers and workers.isdigit():
        config["workers"] = int(workers)

    # Override base URL if needed
    base_url = os.getenv("PLAYWRIGHT_BASE_URL")
    if base_url:
        config["base_url"] = base_url

    return config
