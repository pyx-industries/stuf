"""
Shared service health checking functionality for E2E tests.
This module provides utilities to ensure all services are ready before running tests.
"""

import os
import time
import httpx
import pytest


def check_services_ready():
    """Check that all required services are ready for testing."""
    # Get URLs from environment or defaults
    BASE_URL = os.environ.get("SPA_URL", "http://spa-e2e:3000")
    API_URL = os.environ.get("API_URL", "http://api-e2e:8000")
    KEYCLOAK_URL = os.environ.get("KEYCLOAK_URL", "http://keycloak-e2e:8080")

    services = [
        (f"{API_URL}/api/health", "API"),
        (f"{BASE_URL}", "SPA"),
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
