"""
Shared service health checking functionality for E2E tests.
This module provides utilities to ensure all services are ready before running tests.
"""

import time
import httpx
import pytest

from config import SPA_URL, API_URL, KEYCLOAK_URL


def check_services_ready():
    """Check that all required services are ready for testing."""

    services = [
        (f"{API_URL}/api/health", "API"),
        (f"{SPA_URL}", "SPA"),
        (f"{KEYCLOAK_URL}", "Keycloak"),
    ]

    for url, name in services:
        max_retries = 30
        retry_delay = 2

        for attempt in range(max_retries):
            try:
                with httpx.Client(timeout=5.0) as client:
                    response = client.get(url)
                    if response.status_code < 400:
                        break
            except Exception as e:
                if attempt < max_retries - 1:
                    time.sleep(retry_delay)
                else:
                    raise RuntimeError(
                        f"{name} failed to become ready after {max_retries} attempts: {e}"
                    )
        else:
            raise RuntimeError(f"{name} never became ready")


@pytest.fixture(scope="session", autouse=True)
def ensure_services_ready():
    """Ensure all services are ready before running tests."""
    check_services_ready()
