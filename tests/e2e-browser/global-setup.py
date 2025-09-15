"""Global setup for browser E2E tests - handles authentication state."""

import asyncio
import json
import os
from pathlib import Path
from playwright.async_api import async_playwright

# Test configuration - E2E ports
BASE_URL = "http://localhost:3100"
KEYCLOAK_URL = "http://localhost:8180"
STORAGE_STATE_FILE = Path(__file__).parent / "auth-storage-state.json"

# Default test user credentials (matches Keycloak realm setup)
DEFAULT_USERNAME = "admin@example.com"
DEFAULT_PASSWORD = "password"

async def authenticate_user(username=None, password=None):
    """
    Perform OIDC authentication flow and save storage state.
    
    This function:
    1. Launches a browser
    2. Navigates to the SPA
    3. Goes through Keycloak OIDC login flow
    4. Saves authentication state for reuse in tests
    """
    username = username or os.getenv("E2E_USERNAME", DEFAULT_USERNAME)
    password = password or os.getenv("E2E_PASSWORD", DEFAULT_PASSWORD)
    
    print(f"Authenticating user: {username}")
    
    async with async_playwright() as p:
        # Launch browser for authentication
        browser = await p.chromium.launch(
            headless=os.getenv("PLAYWRIGHT_HEADLESS", "true").lower() == "true",
            args=["--disable-web-security", "--disable-features=VizDisplayCompositor"]
        )
        
        try:
            # Create new browser context
            context = await browser.new_context(
                viewport={"width": 1280, "height": 720},
                ignore_https_errors=True,
            )
            
            page = await context.new_page()
            
            # Set up console and network logging
            console_logs = []
            network_logs = []
            
            def log_console(msg):
                console_logs.append(f"[{msg.type.upper()}] {msg.text}")
                print(f"CONSOLE [{msg.type.upper()}]: {msg.text}")
            
            def log_network(request):
                network_logs.append(f"REQUEST: {request.method} {request.url}")
                print(f"NETWORK: {request.method} {request.url}")
            
            def log_response(response):
                network_logs.append(f"RESPONSE: {response.status} {response.url}")
                print(f"RESPONSE: {response.status} {response.url}")
            
            page.on("console", log_console)
            page.on("request", log_network)
            page.on("response", log_response)
            
            # Navigate to SPA - this should trigger OIDC redirect
            print(f"Navigating to SPA: {BASE_URL}")
            await page.goto(BASE_URL)
            
            # Debug: Check current URL and page content
            current_url = page.url
            print(f"Current URL after navigation: {current_url}")
            
            # Wait a moment for any redirects
            await page.wait_for_timeout(2000)
            
            current_url = page.url
            print(f"Current URL after wait: {current_url}")
            
            # Check if we're already at Keycloak or if redirect happened
            if "keycloak" not in current_url.lower() and "auth" not in current_url:
                print("No automatic redirect detected. Checking page content...")
                
                # Take screenshot for debugging
                debug_screenshot = Path(__file__).parent / "reports" / "pre-auth-debug.png"
                await page.screenshot(path=str(debug_screenshot))
                print(f"Debug screenshot saved: {debug_screenshot}")
                
                # Look for login button or auth trigger
                login_selectors = [
                    'button:text("Login")', 'a:text("Login")', '[data-testid="login"]',
                    'button:text("Sign In")', 'a:text("Sign In")', '[data-testid="signin"]'
                ]
                
                for selector in login_selectors:
                    try:
                        login_element = await page.wait_for_selector(selector, timeout=1000)
                        if login_element:
                            print(f"Found login element: {selector}")
                            await login_element.click()
                            break
                    except:
                        continue
                else:
                    print("No login button found. SPA may not be configured for OIDC.")
            
            # Wait for redirect to Keycloak login page
            print("Waiting for Keycloak login page...")
            await page.wait_for_url(f"{KEYCLOAK_URL}/realms/stuf/protocol/openid-connect/auth*")
            
            # Debug: Check current URL and take screenshot
            current_url = page.url
            print(f"At Keycloak login page: {current_url}")
            
            # Take screenshot of login page for debugging
            login_screenshot = Path(__file__).parent / "reports" / "keycloak-login-page.png"
            await page.screenshot(path=str(login_screenshot))
            print(f"Keycloak login screenshot saved: {login_screenshot}")
            
            # Check what login form fields are available
            print("Looking for login form fields...")
            username_selectors = [
                'input[name="username"]', 
                'input[id="username"]', 
                '#username',
                'input[type="email"]',
                'input[placeholder*="username"]',
                'input[placeholder*="email"]'
            ]
            
            password_selectors = [
                'input[name="password"]',
                'input[id="password"]',
                '#password',
                'input[type="password"]'
            ]
            
            # Find username field
            username_field = None
            for selector in username_selectors:
                try:
                    username_field = await page.wait_for_selector(selector, timeout=2000)
                    if username_field:
                        print(f"Found username field: {selector}")
                        break
                except:
                    continue
            
            if not username_field:
                print("ERROR: Could not find username field")
                raise Exception("Username field not found")
            
            # Find password field
            password_field = None
            for selector in password_selectors:
                try:
                    password_field = await page.wait_for_selector(selector, timeout=2000)
                    if password_field:
                        print(f"Found password field: {selector}")
                        break
                except:
                    continue
            
            if not password_field:
                print("ERROR: Could not find password field")
                raise Exception("Password field not found")
            
            # Fill in login credentials
            print("Filling login form...")
            await username_field.fill(username)
            await password_field.fill(password)
            
            # Find and click submit button
            print("Submitting login...")
            submit_selectors = [
                'button[type="submit"]',
                'input[type="submit"]', 
                '#kc-login',
                'button:text("Sign In")',
                'button:text("Login")',
                '.btn-primary'
            ]
            
            submit_button = None
            for selector in submit_selectors:
                try:
                    submit_button = await page.wait_for_selector(selector, timeout=2000)
                    if submit_button:
                        print(f"Found submit button: {selector}")
                        await submit_button.click()
                        break
                except:
                    continue
            
            if not submit_button:
                print("ERROR: Could not find submit button")
                raise Exception("Submit button not found")
            
            # Wait a moment and check what happened
            print("Waiting for callback processing...")
            await page.wait_for_timeout(5000)
            current_url = page.url
            print(f"Current URL after submit: {current_url}")
            
            # Log recent console and network activity
            print("=== RECENT CONSOLE LOGS ===")
            for log in console_logs[-10:]:  # Last 10 console messages
                print(log)
            
            print("=== RECENT NETWORK ACTIVITY ===") 
            for log in network_logs[-10:]:  # Last 10 network requests
                print(log)
                
            # Check for auth errors or if still on Keycloak
            if "error" in current_url.lower():
                print("Authentication error detected in URL")
                auth_error_screenshot = Path(__file__).parent / "reports" / "auth-error.png"
                await page.screenshot(path=str(auth_error_screenshot))
                print(f"Auth error screenshot: {auth_error_screenshot}")
            
            # Wait for redirect back to SPA (with more flexible matching)
            print("Waiting for redirect back to SPA...")
            try:
                await page.wait_for_url(f"{BASE_URL}*", timeout=15000)
            except:
                # If direct URL match fails, check if we're at least at the base domain
                current_url = page.url
                print(f"Redirect timeout. Current URL: {current_url}")
                if "localhost:3100" in current_url:
                    print("We're at the SPA domain, continuing...")
                    
                    # Take a screenshot of the callback state
                    callback_screenshot = Path(__file__).parent / "reports" / "callback-state.png"
                    await page.screenshot(path=str(callback_screenshot))
                    print(f"Callback state screenshot: {callback_screenshot}")
                else:
                    raise Exception(f"Not redirected to SPA. Current URL: {current_url}")
                    
            # Give more time for OIDC processing after callback
            print("Waiting for OIDC token processing...")
            await page.wait_for_timeout(3000)
            
            # Wait for authentication to complete
            # Look for a sign that the user is logged in (adjust selector as needed)
            print("Waiting for authentication completion...")
            
            # Wait for React OIDC context to process the callback and store auth state
            # We'll check for the actual content that appears when authenticated
            max_attempts = 15
            auth_complete = False
            
            for attempt in range(max_attempts):
                try:
                    # Check if React OIDC has processed the auth
                    # Look for "File Management" text which only appears when authenticated
                    file_mgmt = await page.wait_for_selector('text="File Management"', timeout=2000)
                    if file_mgmt:
                        print("Authentication successful - SPA showing authenticated content")
                        auth_complete = True
                        break
                        
                    # Also check that we're not seeing "Authentication Required"
                    auth_required = page.locator('text="Authentication Required"')
                    if not await auth_required.is_visible():
                        print("Authentication successful - not seeing auth required message")
                        auth_complete = True
                        break
                        
                except:
                    print(f"Waiting for auth completion... ({attempt + 1}/{max_attempts})")
                    await page.wait_for_timeout(1000)
            
            if not auth_complete:
                print("Timeout waiting for auth completion, but continuing...")
                # Fallback: just wait a bit more for the auth state to settle
                await page.wait_for_timeout(3000)
            
            # Give extra time for OIDC context to save to localStorage
            print("Waiting for OIDC state to be saved to localStorage...")
            max_storage_attempts = 10
            for attempt in range(max_storage_attempts):
                try:
                    # Check if oidc data exists in localStorage
                    oidc_user = await page.evaluate('() => {return localStorage.getItem("oidc.user:" + window.location.origin + ":stuf-spa")}')
                    if oidc_user and oidc_user != "null":
                        print(f"OIDC user data found in localStorage after {attempt + 1} attempts")
                        break
                    else:
                        print(f"Waiting for OIDC data in localStorage... ({attempt + 1}/{max_storage_attempts})")
                        await page.wait_for_timeout(1000)
                except Exception as e:
                    print(f"Error checking localStorage: {e}")
                    await page.wait_for_timeout(1000)
            else:
                print("Warning: No OIDC user data found in localStorage - tests may fail")
            
            # Save storage state (cookies, localStorage, sessionStorage)
            print(f"Saving authentication state to: {STORAGE_STATE_FILE}")
            await context.storage_state(path=str(STORAGE_STATE_FILE))
            
            print("Authentication setup complete!")
            
        except Exception as e:
            print(f"Authentication failed: {e}")
            # Take a screenshot for debugging
            screenshot_path = Path(__file__).parent / "reports" / "auth-failure.png"
            screenshot_path.parent.mkdir(exist_ok=True)
            try:
                await page.screenshot(path=str(screenshot_path))
                print(f"Failure screenshot saved: {screenshot_path}")
            except:
                pass
            raise
            
        finally:
            await browser.close()

def global_setup():
    """Pytest global setup function - called once before all tests."""
    print("\nStarting global setup for browser E2E tests...")
    
    # Ensure reports directory exists
    reports_dir = Path(__file__).parent / "reports"
    reports_dir.mkdir(exist_ok=True)
    
    # Run authentication
    try:
        asyncio.run(authenticate_user())
    except Exception as e:
        print(f"Global setup failed: {e}")
        raise

if __name__ == "__main__":
    # Allow running this script directly for debugging
    global_setup()